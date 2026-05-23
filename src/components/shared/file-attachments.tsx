'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, Image, FileArchive, Paperclip, Trash2, Upload, Download, FileImage } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate } from '@/lib/utils'

interface Attachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  pathname?: string | null
  uploadedById?: string
  createdAt: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z')) return FileArchive
  if (mimeType === 'application/pdf') return FileText
  return FileText
}

interface FileAttachmentsProps {
  targetType: string
  targetId: string
}

export function FileAttachments({ targetType, targetId }: FileAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: session } = useSession()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const currentUserId = session?.user?.id
  const currentUserRole = (session?.user as { role?: string } | undefined)?.role

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/attachments?targetType=${targetType}&targetId=${targetId}`)
      if (!res.ok) throw new Error('Failed to fetch attachments')
      const data = await res.json()
      setAttachments(data)
    } catch {
      toast.error('Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }, [targetType, targetId])

  useEffect(() => { fetchAttachments() }, [fetchAttachments])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetType', targetType)
      formData.append('targetId', targetId)

      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to upload file')
      }
      const newAttachment = await res.json()
      setAttachments((prev) => [newAttachment, ...prev])
      toast.success('File uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setSubmitting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/attachments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete attachment')
      setAttachments((prev) => prev.filter((a) => a.id !== id))
      toast.success('File deleted')
    } catch {
      toast.error('Failed to delete file')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Files ({attachments.length})</h3>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.txt,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={submitting}
          />
          <Button size="sm" disabled={submitting}>
            <Upload className="h-3.5 w-3.5" />
            {submitting ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-zinc-400">Loading files...</div>
      ) : attachments.length === 0 ? (
        <EmptyState icon={Paperclip} title="No files" description="Upload PDFs, images, documents, and more" />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.mimeType)
            const canDelete = currentUserId === attachment.uploadedById || currentUserRole === 'SUPER_ADMIN'
            const isImage = attachment.mimeType.startsWith('image/')
            return (
              <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white p-3">
                {isImage ? (
                  <img src={attachment.url} alt={attachment.fileName} className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                    <Icon className="h-4 w-4 text-zinc-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-zinc-900 hover:text-zinc-600 hover:underline block"
                  >
                    {attachment.fileName}
                  </a>
                  <p className="text-xs text-zinc-400">
                    {formatBytes(attachment.fileSize)} &middot; {formatDate(attachment.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

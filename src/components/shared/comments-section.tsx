'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { MessageSquare, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate } from '@/lib/utils'

interface Comment {
  id: string
  text: string
  createdAt: string
  user: { id: string; name: string; email: string }
}

interface CommentsSectionProps {
  targetType: string
  targetId: string
}

export function CommentsSection({ targetType, targetId }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const currentUserId = session?.user?.id

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`)
      if (!res.ok) throw new Error('Failed to fetch comments')
      const data = await res.json()
      setComments(data)
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [targetType, targetId])

  useEffect(() => { fetchComments() }, [fetchComments])

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), targetType, targetId }),
      })
      if (!res.ok) throw new Error('Failed to create comment')
      const newComment = await res.json()
      setComments((prev) => [...prev, newComment])
      setText('')
      toast.success('Comment added')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete comment')
      setComments((prev) => prev.filter((c) => c.id !== id))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900">Comments ({comments.length})</h3>

      {loading ? (
        <div className="py-8 text-center text-sm text-zinc-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No comments yet" description="Be the first to comment" />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 rounded-lg border border-zinc-100 bg-white p-3">
              <Avatar name={comment.user.name} size="sm" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{comment.user.name}</span>
                    <span className="text-xs text-zinc-400">{formatDate(comment.createdAt)}</span>
                  </div>
                  {currentUserId === comment.user.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-zinc-600">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUserId && (
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="min-h-[60px] flex-1 resize-none rounded-lg border border-zinc-300 bg-white p-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-modal'

interface WebhookData {
  id: string
  name: string
  url: string
  events: string
  active: boolean
}

export function WebhookActions({ webhook }: { webhook: WebhookData }) {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const ok = await confirm({ title: 'Delete webhook', message: 'Delete this webhook?', confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Webhook deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete webhook')
    }
  }

  async function handleTest() {
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}/test`, { method: 'POST' })
      if (!res.ok) throw new Error('Test failed')
      toast.success('Test payload sent')
    } catch {
      toast.error('Failed to send test payload')
    }
  }

  return (
    <>{dialog}<div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleTest} title="Test webhook">
        <Play className="h-4 w-4" />
      </Button>
      <Link href={`/webhooks/${webhook.id}/edit`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div></>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-modal'

interface TrashActionsProps {
  itemId: string
  type: 'goal' | 'task'
}

export function TrashActions({ itemId, type }: TrashActionsProps) {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()
  const [restoring, setRestoring] = useState(false)
  const [purging, setPurging] = useState(false)

  async function handleRestore() {
    setRestoring(true)
    try {
      const res = await fetch(`/api/trash/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Item restored')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setRestoring(false)
    }
  }

  async function handlePurge() {
    const ok = await confirm({ title: 'Permanently delete', message: 'Are you sure you want to permanently delete this item? This cannot be undone.', confirmLabel: 'Delete permanently', variant: 'danger' })
    if (!ok) return
    setPurging(true)
    try {
      const res = await fetch(`/api/trash/${itemId}/purge`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Item permanently deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPurging(false)
    }
  }

  return (
    <>{dialog}<div className="flex shrink-0 gap-2">
      <Button variant="secondary" size="sm" onClick={handleRestore} disabled={restoring}>
        <RotateCcw className={`h-4 w-4 ${restoring ? 'animate-spin' : ''}`} />
        {restoring ? '...' : 'Restore'}
      </Button>
      <Button variant="danger" size="sm" onClick={handlePurge} disabled={purging}>
        <Trash2 className="h-4 w-4" />
        {purging ? '...' : 'Delete'}
      </Button>
    </div></>
  )
}

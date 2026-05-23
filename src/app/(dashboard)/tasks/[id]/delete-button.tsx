'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-modal'

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()
  async function handleDelete() {
    const ok = await confirm({ title: 'Delete task', message: 'Delete this task? This cannot be undone.', confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Task deleted')
    router.push('/tasks')
    router.refresh()
  }
  return <>{dialog}<Button variant="danger" onClick={handleDelete}><Trash2 className="h-4 w-4" /> Delete</Button></>
}

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter()
  async function handleDelete() {
    if (!confirm('Delete this task? This cannot be undone.')) return
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Task deleted')
    router.push('/tasks')
    router.refresh()
  }
  return <Button variant="danger" onClick={handleDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
}

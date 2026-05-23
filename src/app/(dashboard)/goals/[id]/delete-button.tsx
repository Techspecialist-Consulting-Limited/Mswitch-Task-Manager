'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-modal'

interface DeleteGoalButtonProps {
  goalId: string
}

export function DeleteGoalButton({ goalId }: DeleteGoalButtonProps) {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const ok = await confirm({ title: 'Delete goal', message: 'Are you sure you want to delete this goal? This action cannot be undone.', confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Goal deleted')
    router.push('/goals')
    router.refresh()
  }

  return (
    <>
      {dialog}
      <Button variant="danger" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
    </>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteGoalButtonProps {
  goalId: string
}

export function DeleteGoalButton({ goalId }: DeleteGoalButtonProps) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) return
    const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Goal deleted')
    router.push('/goals')
    router.refresh()
  }

  return (
    <Button variant="danger" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" /> Delete
    </Button>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Repeat, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function computeNextDeadline(currentDeadline: string | null, recurrence: string): string | null {
  if (!currentDeadline) return null
  const d = new Date(currentDeadline)
  switch (recurrence) {
    case 'DAILY': d.setDate(d.getDate() + 1); break
    case 'WEEKLY': d.setDate(d.getDate() + 7); break
    case 'MONTHLY': d.setMonth(d.getMonth() + 1); break
  }
  return d.toISOString()
}

interface CreateNextInstanceButtonProps {
  taskId: string
  recurrence: string
  deadline: string | null
  assignedToId: string
}

export function CreateNextInstanceButton({ taskId, recurrence, deadline, assignedToId }: CreateNextInstanceButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    const taskRes = await fetch(`/api/tasks/${taskId}`)
    if (!taskRes.ok) { toast.error('Failed to fetch task'); setLoading(false); return }
    const task = await taskRes.json()

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        assignedToId,
        deadline: computeNextDeadline(deadline, recurrence),
        recurrence,
        parentTaskId: taskId,
      }),
    })
    if (!res.ok) { toast.error('Failed to create next instance'); setLoading(false); return }
    toast.success('Next instance created')
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="secondary" className="w-full" onClick={handleCreate} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
      Create Next Instance
    </Button>
  )
}

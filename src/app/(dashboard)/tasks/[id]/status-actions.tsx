'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const STATUS_FLOW = ['TODO', 'IN_PROGRESS', 'DONE'] as const

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

interface TaskStatusActionsProps {
  taskId: string
  currentStatus: string
  canUpdate: boolean
  recurrence?: string | null
  deadline?: string | null
  assignedToId?: string
  assignedById?: string
}

export function TaskStatusActions({ taskId, currentStatus, canUpdate, recurrence, deadline, assignedToId }: TaskStatusActionsProps) {
  const router = useRouter()

  async function updateStatus(status: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('Failed to update status'); return }
    toast.success('Status updated')

    if (status === 'DONE' && recurrence && assignedToId) {
      const taskRes = await fetch(`/api/tasks/${taskId}`)
      if (taskRes.ok) {
        const task = await taskRes.json()
        const newDeadline = computeNextDeadline(deadline || null, recurrence)
        const createRes = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description || '',
            assignedToId,
            deadline: newDeadline,
            recurrence,
            parentTaskId: taskId,
          }),
        })
        if (createRes.ok) {
          toast.success('Next recurring instance created')
        }
      }
    }

    router.refresh()
  }

  const currentIdx = STATUS_FLOW.indexOf(currentStatus as typeof STATUS_FLOW[number])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className={`h-px w-6 ${i <= currentIdx ? 'bg-zinc-900' : 'bg-zinc-200'}`} />}
            <button
              onClick={() => canUpdate && updateStatus(s)}
              disabled={!canUpdate}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                s === currentStatus ? 'bg-zinc-900 text-white' : i < currentIdx ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
              } ${canUpdate && s !== currentStatus ? 'hover:bg-zinc-200 cursor-pointer' : 'cursor-default'}`}
            >
              {s === 'TODO' && '📋'}
              {s === 'IN_PROGRESS' && '🔄'}
              {s === 'DONE' && '✅'}
              {s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
            </button>
          </div>
        ))}
      </div>
      {currentStatus === 'DONE' && <p className="text-xs text-emerald-600">This task is complete.</p>}
      {recurrence && <p className="text-xs text-zinc-500">Recurring: {recurrence === 'DAILY' ? 'Daily' : recurrence === 'WEEKLY' ? 'Weekly' : 'Monthly'}</p>}
    </div>
  )
}

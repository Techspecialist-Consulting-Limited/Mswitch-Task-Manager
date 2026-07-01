'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Plus, CheckSquare, Calendar, Download } from 'lucide-react'
import { InlineEdit } from '@/components/shared/inline-edit'
import { BulkActions } from '@/components/shared/bulk-actions'
import { formatDate } from '@/lib/utils'
import { canAssignTasks } from '@/lib/permissions'
import { toast } from 'sonner'

const STATUS_BADGE: Record<string, { variant: 'info' | 'success' | 'default'; label: string }> = {
  TODO: { variant: 'default', label: 'To Do' },
  IN_PROGRESS: { variant: 'info', label: 'In Progress' },
  DONE: { variant: 'success', label: 'Done' },
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  deadline: string | null
  assignedToId: string
  assignedById: string
  assignedTo: { id: string; name: string }
  assignedBy: { name: string }
  createdAt: string
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sessionRole, setSessionRole] = useState<string>('')
  const [sessionUserId, setSessionUserId] = useState<string>('')

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setTasks(d)
      setLoading(false)
    }).catch(() => setLoading(false))

    fetch('/api/auth/session').then(r => r.json()).then(s => {
      if (s?.user) {
        setSessionRole(s.user.role)
        setSessionUserId(s.user.id)
      }
    }).catch(() => {})
  }, [])

  function canEdit(task: Task) {
    return sessionRole === 'SUPER_ADMIN' || canAssignTasks(sessionRole) || task.assignedToId === sessionUserId
  }

  const canCreate = canAssignTasks(sessionRole)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  async function handleBulkAction(action: string, ids: string[]) {
    if (action === 'clear') { setSelectedIds([]); return }

    for (const id of ids) {
      if (action === 'delete') {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      } else if (action === 'mark_in_progress') {
        await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'IN_PROGRESS' }) })
      } else if (action === 'mark_done') {
        await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'DONE' }) })
      }
    }

    toast.success(`${ids.length} task(s) updated`)
    setSelectedIds([])
    router.refresh()
    const res = await fetch('/api/tasks')
    const d = await res.json()
    if (Array.isArray(d)) setTasks(d)
  }

  async function handleTitleSave(taskId: string, newTitle: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    if (!res.ok) throw new Error('Failed')
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: newTitle } : t))
    router.refresh()
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Tasks" description="Manage your assigned tasks" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-100 mb-3" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-100 mb-2" />
                <div className="h-4 w-full animate-pulse rounded bg-zinc-100 mb-3" />
                <div className="h-8 w-full animate-pulse rounded bg-zinc-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Tasks" description="Manage your assigned tasks">
        <a href="/api/export/tasks"><Button variant="secondary"><Download className="h-4 w-4" /> Export CSV</Button></a>
        {canCreate && <Link href="/tasks/new"><Button><Plus className="h-4 w-4" /> New Task</Button></Link>}
      </PageHeader>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <CheckSquare className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">No tasks</h3>
              <p className="mt-1 text-sm text-zinc-500">No tasks to show.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => {
            const sb = STATUS_BADGE[task.status] || { variant: 'default', label: task.status }
            const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE'
            const edit = canEdit(task)
            return (
              <Card key={task.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="h-4 w-4 rounded border-zinc-300 accent-indigo-600 focus:ring-indigo-500"
                        onClick={e => e.stopPropagation()}
                      />
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                    </div>
                    {overdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
                  </div>
                  <Link href={`/tasks/${task.id}`} className="block">
                    <InlineEdit
                      value={task.title}
                      onSave={async (v) => { await handleTitleSave(task.id, v) }}
                      className="mb-1 font-semibold text-zinc-900"
                      disabled={!edit}
                    />
                    {task.description && <p className="mb-3 line-clamp-2 text-sm text-zinc-500">{task.description}</p>}
                  </Link>
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={task.assignedTo.name} size="sm" />
                      <span className="text-xs text-zinc-500">{task.assignedTo.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      {task.deadline && (
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                          <Calendar className="h-3.5 w-3.5" /> {formatDate(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <BulkActions
        selectedIds={selectedIds}
        onAction={handleBulkAction}
        onClear={() => setSelectedIds([])}
        actions={[
          { value: 'mark_in_progress', label: 'Mark In Progress' },
          { value: 'mark_done', label: 'Mark Done' },
          { value: 'delete', label: 'Delete' },
        ]}
      />
    </div>
  )
}

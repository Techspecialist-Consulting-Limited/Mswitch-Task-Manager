'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { TASK_STATUSES } from '@/lib/constants'

const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<{ id: string; name: string; unit: { name: string } | null }[]>([])
  const [task, setTask] = useState<{ id: string; title: string; description: string | null; status: string; deadline: string | null; assignedToId: string; recurrence: string | null } | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      Promise.all([
        fetch(`/api/tasks/${id}`).then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
      ]).then(([taskData, usersData]) => {
        setTask(taskData)
        setUsers(Array.isArray(usersData) ? usersData : [])
        setFetching(false)
      }).catch(() => { setFetching(false); setError('Failed to load') })
    })
  }, [params])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!task) return
    setLoading(true); setError('')
    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const description = form.get('description') as string
    const assignedToId = form.get('assignedToId') as string
    const deadline = form.get('deadline') as string
    const status = form.get('status') as string
    const recurrence = form.get('recurrence') as string

    if (!title || !assignedToId) { setError('Title and assignee are required'); setLoading(false); return }
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, assignedToId, deadline: deadline || null, status, recurrence: recurrence || null }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to update'); setLoading(false); return }
    toast.success('Task updated')
    router.push(`/tasks/${task.id}`)
    router.refresh()
  }

  if (fetching) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
  if (!task) return <div className="py-16 text-center text-sm text-red-500">Task not found</div>

  return (
    <div>
      <PageHeader title="Edit Task" description="Update task details">
        <Link href={`/tasks/${task.id}`}><Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      </PageHeader>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Edit Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="title" name="title" label="Title" defaultValue={task.title} required />
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700">Description</label>
              <textarea id="description" name="description" rows={3} defaultValue={task.description || ''} className="flex w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <Select id="assignedToId" name="assignedToId" label="Assign to" options={users.map(u => ({ value: u.id, label: u.unit ? `${u.name} (${u.unit.name})` : u.name }))} defaultValue={task.assignedToId} required />
            <Input id="deadline" name="deadline" type="date" label="Deadline (optional)" defaultValue={task.deadline ? task.deadline.split('T')[0] : ''} />
            <Select id="recurrence" name="recurrence" label="Recurrence" options={RECURRENCE_OPTIONS} defaultValue={task.recurrence || ''} />
            <Select id="status" name="status" label="Status" options={TASK_STATUSES.map(s => ({ value: s, label: s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Done' }))} defaultValue={task.status} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

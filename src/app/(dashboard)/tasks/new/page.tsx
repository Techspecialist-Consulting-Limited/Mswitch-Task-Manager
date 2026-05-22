'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<{ id: string; name: string; unit: { name: string } | null }[]>([])

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const description = form.get('description') as string
    const assignedToId = form.get('assignedToId') as string
    const deadline = form.get('deadline') as string
    const recurrence = form.get('recurrence') as string

    if (!title || !assignedToId) { setError('Title and assignee are required'); setLoading(false); return }

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, assignedToId, deadline: deadline || null, recurrence: recurrence || null }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to create'); setLoading(false); return }
    toast.success('Task created')
    router.push('/tasks')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="New Task" description="Assign a task to a team member">
        <Link href="/tasks"><Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      </PageHeader>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Task Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="title" name="title" label="Title" placeholder="e.g. Review Q1 data" required />
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700">Description</label>
              <textarea id="description" name="description" rows={3} className="flex w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="Task description..." />
            </div>
            <Select id="assignedToId" name="assignedToId" label="Assign to" options={users.map(u => ({ value: u.id, label: u.unit ? `${u.name} (${u.unit.name})` : u.name }))} placeholder="Select team member" required />
            <Input id="deadline" name="deadline" type="date" label="Deadline (optional)" />
            <Select id="recurrence" name="recurrence" label="Recurrence" options={RECURRENCE_OPTIONS} placeholder="None" />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

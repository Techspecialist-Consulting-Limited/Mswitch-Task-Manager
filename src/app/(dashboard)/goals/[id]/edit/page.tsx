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
import { GOAL_STATUSES } from '@/lib/constants'

function getMonthOptions(): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = -2; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }
  return months
}

export default function EditGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [goal, setGoal] = useState<{ id: string; title: string; description: string | null; month: string; status: string } | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/goals/${id}`).then(r => r.json()).then(d => { setGoal(d); setFetching(false) }).catch(() => { setFetching(false); setError('Failed to load goal') })
    })
  }, [params])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!goal) return
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const description = form.get('description') as string
    const month = form.get('month') as string
    const status = form.get('status') as string
    if (!title || !month) { setError('Title and month are required'); setLoading(false); return }

    const res = await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, month, status }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to update'); setLoading(false); return }
    toast.success('Goal updated')
    router.push(`/goals/${goal.id}`)
    router.refresh()
  }

  if (fetching) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
  if (!goal) return <div className="py-16 text-center text-sm text-red-500">Goal not found</div>

  return (
    <div>
      <PageHeader title="Edit Goal" description="Update goal details">
        <Link href={`/goals/${goal.id}`}><Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      </PageHeader>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Edit Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="title" name="title" label="Title" defaultValue={goal.title} required />
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700">Description</label>
              <textarea id="description" name="description" rows={3} defaultValue={goal.description || ''} className="flex w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <Select id="month" name="month" label="Month" options={getMonthOptions()} defaultValue={goal.month} required />
            <Select id="status" name="status" label="Status" options={GOAL_STATUSES.map(s => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))} defaultValue={goal.status} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

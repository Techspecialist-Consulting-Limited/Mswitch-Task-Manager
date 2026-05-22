'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { TemplatePicker } from '@/components/shared/template-picker'

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

export default function NewGoalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)

  function handleTemplateSelect(t: { title: string; description: string | null }) {
    setTitle(t.title)
    setDescription(t.description || '')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const goalTitle = form.get('title') as string
    const goalDescription = form.get('description') as string
    const month = form.get('month') as string

    if (!goalTitle || !month) { setError('Title and month are required'); setLoading(false); return }

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: goalTitle, description: goalDescription, month }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to create goal'); setLoading(false); return }

    if (saveAsTemplate) {
      await fetch('/api/goal-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: goalTitle, description: goalDescription }),
      }).catch(() => {})
    }

    toast.success('Goal created')
    router.push('/goals')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="New Goal" description="Create a new monthly goal">
        <Link href="/goals"><Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      </PageHeader>
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Goal Details</CardTitle>
            <TemplatePicker onSelect={handleTemplateSelect} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="title" name="title" label="Title" placeholder="e.g. Q2 Revenue Target" value={title} onChange={e => setTitle(e.target.value)} required />
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700">Description</label>
              <textarea id="description" name="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} className="flex w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="Describe your goal..." />
            </div>
            <Select id="month" name="month" label="Month" options={getMonthOptions()} placeholder="Select month" required />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveAsTemplate"
                checked={saveAsTemplate}
                onChange={e => setSaveAsTemplate(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
              />
              <label htmlFor="saveAsTemplate" className="text-sm text-zinc-600">Save as template</label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Goal'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

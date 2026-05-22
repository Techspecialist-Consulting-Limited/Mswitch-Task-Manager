'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Plus, Target, Calendar, Download } from 'lucide-react'
import { InlineEdit } from '@/components/shared/inline-edit'
import { BulkActions } from '@/components/shared/bulk-actions'
import { toast } from 'sonner'

const MONTH_LABELS: Record<string, string> = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May', '06': 'June', '07': 'July', '08': 'August',
  '09': 'September', '10': 'October', '11': 'November', '12': 'December',
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-')
  return `${MONTH_LABELS[mo] || mo} ${y}`
}

const STATUS_BADGE: Record<string, { variant: 'info' | 'success' | 'default'; label: string }> = {
  ACTIVE: { variant: 'info', label: 'Active' },
  COMPLETED: { variant: 'success', label: 'Completed' },
  CANCELLED: { variant: 'default', label: 'Cancelled' },
}

interface Goal {
  id: string
  title: string
  description: string | null
  month: string
  status: string
  userId: string
  unitId: string | null
  user: { name: string }
  _count: { weeklyGoals: number }
  progress: number
  createdAt: string
}

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sessionRole, setSessionRole] = useState<string>('')
  const [sessionUserId, setSessionUserId] = useState<string>('')
  useEffect(() => {
    fetch('/api/goals').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setGoals(d)
      setLoading(false)
    }).catch(() => setLoading(false))

    fetch('/api/auth/session').then(r => r.json()).then(s => {
      if (s?.user) {
        setSessionRole(s.user.role)
        setSessionUserId(s.user.id)
      }
    }).catch(() => {})
  }, [])

  function canEdit(goal: Goal) {
    return sessionRole === 'SUPER_ADMIN' || (sessionRole === 'UNIT_LEAD' && goal.unitId !== null) || goal.userId === sessionUserId
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  async function handleBulkAction(action: string, ids: string[]) {
    if (action === 'clear') { setSelectedIds([]); return }

    for (const id of ids) {
      if (action === 'delete') {
        await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      } else if (action === 'mark_active') {
        await fetch(`/api/goals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ACTIVE' }) })
      } else if (action === 'mark_completed') {
        await fetch(`/api/goals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'COMPLETED' }) })
      }
    }

    toast.success(`${ids.length} goal(s) updated`)
    setSelectedIds([])
    router.refresh()
    const res = await fetch('/api/goals')
    const d = await res.json()
    if (Array.isArray(d)) setGoals(d)
  }

  async function handleTitleSave(goalId: string, newTitle: string) {
    const res = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    if (!res.ok) throw new Error('Failed')
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, title: newTitle } : g))
    router.refresh()
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Goals" description="Monthly goals and weekly breakdowns" />
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
      <PageHeader title="Goals" description="Monthly goals and weekly breakdowns">
        <a href="/api/export/goals"><Button variant="secondary"><Download className="h-4 w-4" /> Export CSV</Button></a>
        <Link href="/goals/new"><Button><Plus className="h-4 w-4" /> New Goal</Button></Link>
      </PageHeader>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <Target className="h-7 w-7 text-zinc-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">No goals yet</h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">Create your first monthly goal to get started.</p>
              <Link href="/goals/new"><Button className="mt-4"><Plus className="h-4 w-4" /> Create Goal</Button></Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const sb = STATUS_BADGE[goal.status] || { variant: 'default', label: goal.status }
            const edit = canEdit(goal)
            return (
              <Card key={goal.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(goal.id)}
                        onChange={() => toggleSelect(goal.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                        onClick={e => e.stopPropagation()}
                      />
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                    </div>
                    <span className="text-xs text-zinc-400">{goal._count.weeklyGoals} weeks</span>
                  </div>
                  <Link href={`/goals/${goal.id}`} className="block">
                    <InlineEdit
                      value={goal.title}
                      onSave={async (v) => { await handleTitleSave(goal.id, v) }}
                      className="mb-1 font-semibold text-zinc-900"
                      disabled={!edit}
                    />
                    {goal.description && <p className="mb-3 line-clamp-2 text-sm text-zinc-500">{goal.description}</p>}
                  </Link>
                  <div className="mb-3">
                    <Progress value={goal.progress} size="sm" showLabel />
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={goal.user.name} size="sm" />
                      <span className="text-xs text-zinc-500">{goal.user.name}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" /> {formatMonth(goal.month)}
                    </span>
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
          { value: 'mark_active', label: 'Mark Active' },
          { value: 'mark_completed', label: 'Mark Completed' },
          { value: 'delete', label: 'Delete' },
        ]}
      />
    </div>
  )
}

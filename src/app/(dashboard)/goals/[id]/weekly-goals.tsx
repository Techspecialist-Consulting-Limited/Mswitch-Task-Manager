'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Plus, Pencil, Trash2, Target, X, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface WeeklyGoal {
  id: string
  weekNumber: number
  title: string
  description: string | null
  status: string
}

interface Update {
  id: string
  updateText: string
  progressPercentage: number
  blockers: string | null
  user: { id: string; name: string }
  createdAt: string
}

interface WeeklyGoalsSectionProps {
  goalId: string
  initial: WeeklyGoal[]
  canEdit: boolean
}

export function WeeklyGoalsSection({ goalId, initial, canEdit }: WeeklyGoalsSectionProps) {
  const router = useRouter()
  const [goals, setGoals] = useState<WeeklyGoal[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updates, setUpdates] = useState<Record<string, Update[]>>({})
  const [updatesLoading, setUpdatesLoading] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({ weekNumber: '', title: '', description: '' })
  const [updateForm, setUpdateForm] = useState({ updateText: '', progressPercentage: 0, blockers: '' })
  const [updateFormLoading, setUpdateFormLoading] = useState(false)

  function resetForm() { setForm({ weekNumber: '', title: '', description: '' }); setShowForm(false); setEditingId(null) }
  function resetUpdateForm() { setUpdateForm({ updateText: '', progressPercentage: 0, blockers: '' }) }

  // --- Weekly Goal CRUD ---

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.weekNumber) { toast.error('Title and week number are required'); return }
    setLoading(true)
    const res = await fetch('/api/weekly-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyGoalId: goalId, weekNumber: parseInt(form.weekNumber), title: form.title, description: form.description || null }),
    })
    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); setLoading(false); return }
    const created = await res.json()
    setGoals(prev => [...prev, created].sort((a, b) => a.weekNumber - b.weekNumber))
    toast.success('Weekly goal created')
    resetForm(); setLoading(false); router.refresh()
  }

  async function handleUpdate(id: string) {
    if (!form.title || !form.weekNumber) { toast.error('Title and week number are required'); return }
    setLoading(true)
    const res = await fetch(`/api/weekly-goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekNumber: parseInt(form.weekNumber), title: form.title, description: form.description || null }),
    })
    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); setLoading(false); return }
    const updated = await res.json()
    setGoals(prev => prev.map(g => g.id === id ? updated : g).sort((a, b) => a.weekNumber - b.weekNumber))
    toast.success('Weekly goal updated')
    resetForm(); setLoading(false); router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this weekly goal? This will also remove all its updates.')) return
    const res = await fetch(`/api/weekly-goals/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    setGoals(prev => prev.filter(g => g.id !== id))
    if (expandedId === id) setExpandedId(null)
    toast.success('Weekly goal deleted')
    router.refresh()
  }

  function startEdit(wg: WeeklyGoal) {
    setEditingId(wg.id)
    setForm({ weekNumber: String(wg.weekNumber), title: wg.title, description: wg.description || '' })
    setShowForm(false)
  }

  // --- Updates ---

  async function toggleExpand(wgId: string) {
    if (expandedId === wgId) { setExpandedId(null); return }
    setExpandedId(wgId)
    if (!updates[wgId]) {
      setUpdatesLoading(prev => ({ ...prev, [wgId]: true }))
      try {
        const res = await fetch(`/api/weekly-updates?weeklyGoalId=${wgId}`)
        if (res.ok) { const data = await res.json(); setUpdates(prev => ({ ...prev, [wgId]: data })) }
      } catch { /* ignore */ } finally {
        setUpdatesLoading(prev => ({ ...prev, [wgId]: false }))
      }
    }
  }

  async function handleSubmitUpdate(e: React.FormEvent, wgId: string) {
    e.preventDefault()
    if (!updateForm.updateText) { toast.error('Update text is required'); return }
    setUpdateFormLoading(true)
    const res = await fetch('/api/weekly-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weeklyGoalId: wgId, updateText: updateForm.updateText, progressPercentage: updateForm.progressPercentage, blockers: updateForm.blockers || null }),
    })
    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); setUpdateFormLoading(false); return }
    const created = await res.json()
    setUpdates(prev => ({ ...prev, [wgId]: [created, ...(prev[wgId] || [])] }))
    toast.success('Update submitted')
    setUpdateFormLoading(false)
    resetUpdateForm()
  }

  async function handleDeleteUpdate(updateId: string, wgId: string) {
    if (!confirm('Delete this update?')) return
    const res = await fetch(`/api/weekly-updates/${updateId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    setUpdates(prev => ({ ...prev, [wgId]: (prev[wgId] || []).filter(u => u.id !== updateId) }))
    toast.success('Update deleted')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Goals ({goals.length})</CardTitle>
          {canEdit && !showForm && !editingId && (
            <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm({ weekNumber: '', title: '', description: '' }) }}>
              <Plus className="h-4 w-4" /> Add Week
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(showForm || editingId) && (
          <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId) } : handleCreate} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Week</label>
                <select value={form.weekNumber} onChange={e => setForm(p => ({ ...p, weekNumber: e.target.value }))} className="flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" required>
                  <option value="">Select</option>
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n} disabled={!editingId && goals.some(g => g.weekNumber === n)}>Week {n}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-zinc-600">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="Weekly goal title" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Description (optional)</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="Brief description" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Save' : 'Create'}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={resetForm}><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </form>
        )}

        {goals.length === 0 && !showForm ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Target className="mb-2 h-6 w-6 text-zinc-300" />
            <p className="text-sm text-zinc-400">No weekly goals yet.</p>
            {canEdit && <Button size="sm" variant="secondary" className="mt-3" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add Week 1</Button>}
          </div>
        ) : goals.map((wg) => (
          <div key={wg.id}>
            {editingId === wg.id ? null : (
              <button onClick={() => toggleExpand(wg.id)} className="w-full text-left">
                <div className="flex items-start justify-between rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {expandedId === wg.id ? <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />}
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-100 text-xs font-medium text-zinc-600">W{wg.weekNumber}</span>
                    <p className="text-sm font-medium text-zinc-900 truncate">{wg.title}</p>
                    <Badge variant={wg.status === 'ACTIVE' ? 'info' : wg.status === 'COMPLETED' ? 'success' : 'default'} className="shrink-0">{wg.status}</Badge>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <span role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && startEdit(wg)} onClick={() => startEdit(wg)} className="cursor-pointer rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><Pencil className="h-3.5 w-3.5" /></span>
                      <span role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleDelete(wg.id)} onClick={() => handleDelete(wg.id)} className="cursor-pointer rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></span>
                    </div>
                  )}
                </div>
              </button>
            )}

            {expandedId === wg.id && (
              <div className="ml-8 mt-2 space-y-3 border-l-2 border-zinc-100 pl-4">
                {updatesLoading[wg.id] ? (
                  <p className="text-xs text-zinc-400 py-2">Loading updates...</p>
                ) : (
                  <>
                    {/* Update List */}
                    {(updates[wg.id] || []).length === 0 ? (
                      <p className="text-xs text-zinc-400 py-2">No updates yet.</p>
                    ) : (updates[wg.id] || []).map((u) => (
                      <div key={u.id} className="rounded-lg border border-zinc-100 bg-white p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={u.user.name} size="sm" />
                            <div>
                              <p className="text-xs font-medium text-zinc-900">{u.user.name}</p>
                              <p className="text-xs text-zinc-400">{formatDate(u.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-zinc-600">{u.progressPercentage}%</span>
                          </div>
                        </div>
                        <Progress value={u.progressPercentage} size="sm" className="mb-2" />
                        <p className="text-sm text-zinc-700">{u.updateText}</p>
                        {u.blockers && (
                          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 p-2">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                            <p className="text-xs text-amber-700">{u.blockers}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Submit Update Form */}
                    <form onSubmit={(e) => handleSubmitUpdate(e, wg.id)} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-2">
                      <p className="text-xs font-medium text-zinc-600">Add Update</p>
                      <textarea
                        value={updateForm.updateText}
                        onChange={e => setUpdateForm(p => ({ ...p, updateText: e.target.value }))}
                        rows={2}
                        className="flex w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        placeholder="What progress was made?"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-600">Progress (%)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={updateForm.progressPercentage}
                            onChange={e => setUpdateForm(p => ({ ...p, progressPercentage: parseInt(e.target.value) || 0 }))}
                            className="flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-600">Blockers (optional)</label>
                          <input
                            value={updateForm.blockers}
                            onChange={e => setUpdateForm(p => ({ ...p, blockers: e.target.value }))}
                            className="flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                            placeholder="Any blockers?"
                          />
                        </div>
                      </div>
                      <Button type="submit" size="sm" disabled={updateFormLoading}>
                        {updateFormLoading ? 'Submitting...' : 'Submit Update'}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

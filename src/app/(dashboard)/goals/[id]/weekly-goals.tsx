'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Plus, Pencil, Trash2, Target, X, ChevronDown, ChevronRight, AlertTriangle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { useConfirm } from '@/components/ui/confirm-modal'

interface WeeklyGoal {
  id: string
  weekNumber: number
  title: string
  description: string | null
  status: string
  updateCount?: number
  latestProgress?: number
  blockerCount?: number
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { confirm, dialog } = useConfirm()

  function resetForm() { setForm({ weekNumber: '', title: '', description: '' }); setShowForm(false); setEditingId(null); setFormErrors({}) }
  function resetUpdateForm() { setUpdateForm({ updateText: '', progressPercentage: 0, blockers: '' }); setFormErrors({}) }

  function validateUpdateForm() {
    const errors: Record<string, string> = {}
    if (!updateForm.updateText.trim()) errors.updateText = 'Update text is required'
    const pct = Number(updateForm.progressPercentage)
    if (isNaN(pct) || pct < 0 || pct > 100) errors.progressPercentage = 'Must be 0–100'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.weekNumber) { toast.error('Title and week number are required'); return }
    setLoading(true)
    const res = await fetch('/api/weekly-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyGoalId: goalId, weekNumber: parseInt(form.weekNumber), title: form.title, description: form.description || null }),
    })
    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to create'); setLoading(false); return }
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
    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to update'); setLoading(false); return }
    const updated = await res.json()
    setGoals(prev => prev.map(g => g.id === id ? updated : g).sort((a, b) => a.weekNumber - b.weekNumber))
    toast.success('Weekly goal updated')
    resetForm(); setLoading(false); router.refresh()
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Delete weekly goal', message: 'Delete this weekly goal? This will also remove all its updates.', confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
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
    if (!validateUpdateForm()) return
    setUpdateFormLoading(true)
    const res = await fetch('/api/weekly-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weeklyGoalId: wgId, updateText: updateForm.updateText.trim(), progressPercentage: Number(updateForm.progressPercentage), blockers: updateForm.blockers.trim() || null }),
    })
    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to submit update'); setUpdateFormLoading(false); return }
    const created = await res.json()
    setUpdates(prev => ({ ...prev, [wgId]: [created, ...(prev[wgId] || [])] }))
    setGoals(prev => prev.map(g => g.id === wgId ? {
      ...g,
      updateCount: (g.updateCount || 0) + 1,
      latestProgress: created.progressPercentage,
      blockerCount: created.blockers ? (g.blockerCount || 0) + 1 : (g.blockerCount || 0),
    } : g))
    toast.success('Update submitted')
    setUpdateFormLoading(false)
    resetUpdateForm()
  }

  async function handleDeleteUpdate(updateId: string, wgId: string) {
    const ok = await confirm({ title: 'Delete update', message: 'Delete this update?', confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    const res = await fetch(`/api/weekly-updates/${updateId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    setUpdates(prev => ({ ...prev, [wgId]: (prev[wgId] || []).filter(u => u.id !== updateId) }))
    toast.success('Update deleted')
    router.refresh()
  }

  return (
    <Card>
      {dialog}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weekly Reporting Timeline</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">Break the monthly goal into weekly plans, then submit progress updates with blockers where needed.</p>
          </div>
          {canEdit && !showForm && !editingId && (
            <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm({ weekNumber: '', title: '', description: '' }) }}>
              <Plus className="h-4 w-4" /> Add Week
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="flex flex-col items-center py-12 text-center">
            <Target className="mb-3 h-8 w-8 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">No weekly goals yet</p>
            <p className="mt-1 text-xs text-zinc-400">Break this monthly goal into weekly milestones.</p>
            {canEdit && <Button size="sm" variant="secondary" className="mt-4" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add Week 1</Button>}
          </div>
        ) : goals.map((wg) => {
          const updateCount = wg.updateCount || 0
          const latestProgress = wg.latestProgress || 0
          const blockerCount = wg.blockerCount || 0
          const reportLabel = blockerCount > 0 ? 'Blocker reported' : updateCount > 0 ? 'Update submitted' : 'Awaiting update'
          const reportVariant = blockerCount > 0 ? 'warning' as const : updateCount > 0 ? 'success' as const : 'default' as const

          return (
            <div key={wg.id}>
              {editingId === wg.id ? null : (
                <button onClick={() => toggleExpand(wg.id)} className="w-full text-left">
                  <div className="rounded-lg border border-zinc-100 p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div className="flex flex-col items-center">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-700">W{wg.weekNumber}</span>
                          <span className="mt-2 h-full min-h-8 w-px bg-zinc-100" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {expandedId === wg.id ? <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />}
                            <p className="font-semibold text-zinc-900">{wg.title}</p>
                            <Badge variant={reportVariant} className="shrink-0">{reportLabel}</Badge>
                          </div>
                          {wg.description && <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{wg.description}</p>}
                          <div className="mt-3 max-w-md">
                            <Progress value={latestProgress} size="sm" showLabel />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center lg:min-w-[230px]">
                        <div className="rounded-md bg-white px-2 py-2 shadow-sm ring-1 ring-zinc-100">
                          <p className="text-sm font-semibold text-zinc-900">{updateCount}</p>
                          <p className="text-[11px] text-zinc-500">Updates</p>
                        </div>
                        <div className="rounded-md bg-white px-2 py-2 shadow-sm ring-1 ring-zinc-100">
                          <p className="text-sm font-semibold text-zinc-900">{latestProgress}%</p>
                          <p className="text-[11px] text-zinc-500">Latest</p>
                        </div>
                        <div className="rounded-md bg-white px-2 py-2 shadow-sm ring-1 ring-zinc-100">
                          <p className="text-sm font-semibold text-zinc-900">{blockerCount}</p>
                          <p className="text-[11px] text-zinc-500">Blockers</p>
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="mt-3 flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <span role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && startEdit(wg)} onClick={() => startEdit(wg)} className="cursor-pointer rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><Pencil className="h-3.5 w-3.5" /></span>
                        <span role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleDelete(wg.id)} onClick={() => handleDelete(wg.id)} className="cursor-pointer rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></span>
                      </div>
                    )}
                  </div>
                </button>
              )}

            {expandedId === wg.id && (
              <div className="ml-5 mt-3 space-y-4 border-l-2 border-zinc-100 pl-5">
                {updatesLoading[wg.id] ? (
                  <p className="text-xs text-zinc-400 py-3">Loading updates...</p>
                ) : (
                  <>
                    {/* Update List */}
                    {(updates[wg.id] || []).length === 0 ? (
                      <div className="flex flex-col items-center py-6 text-center">
                        <p className="text-sm text-zinc-400">No updates yet for this week.</p>
                      </div>
                    ) : (updates[wg.id] || []).map((u) => (
                      <div key={u.id} className="rounded-lg border border-zinc-100 bg-white p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={u.user.name} size="sm" />
                            <div>
                              <p className="text-xs font-medium text-zinc-900">{u.user.name}</p>
                              <p className="text-xs text-zinc-400">{formatDate(u.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-600">{u.progressPercentage}%</span>
                            <span role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleDeleteUpdate(u.id, wg.id)} onClick={() => handleDeleteUpdate(u.id, wg.id)} className="cursor-pointer rounded p-1 text-zinc-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></span>
                          </div>
                        </div>
                        <Progress value={u.progressPercentage} size="sm" className="mb-3" />
                        <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{u.updateText}</div>
                        {u.blockers && (
                          <div className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-50 p-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <div className="text-xs text-amber-700 leading-relaxed whitespace-pre-wrap">{u.blockers}</div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Submit Update Form */}
                    <form onSubmit={(e) => handleSubmitUpdate(e, wg.id)} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                      <p className="text-sm font-semibold text-zinc-800">Submit Weekly Report</p>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-600">Work completed this week *</label>
                        <textarea
                          value={updateForm.updateText}
                          onChange={e => setUpdateForm(p => ({ ...p, updateText: e.target.value }))}
                          rows={4}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-y min-h-[80px]"
                          placeholder="Summarize the work completed, key outcomes, and evidence of progress..."
                          required
                        />
                        {formErrors.updateText && <p className="text-xs text-red-500">{formErrors.updateText}</p>}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-600">Reported progress (%) *</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={updateForm.progressPercentage}
                            onChange={e => setUpdateForm(p => ({ ...p, progressPercentage: e.target.value ? parseInt(e.target.value) : 0 }))}
                            className="flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                          />
                          {formErrors.progressPercentage && <p className="text-xs text-red-500">{formErrors.progressPercentage}</p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-600">Blockers or support needed</label>
                          <textarea
                            value={updateForm.blockers}
                            onChange={e => setUpdateForm(p => ({ ...p, blockers: e.target.value }))}
                            rows={2}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
                            placeholder="What is delaying progress, if anything?"
                          />
                        </div>
                      </div>

                      <Button type="submit" size="sm" disabled={updateFormLoading}>
                        {updateFormLoading ? (
                          <>Submitting...</>
                        ) : (
                          <><Send className="h-3.5 w-3.5" /> Submit Update</>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

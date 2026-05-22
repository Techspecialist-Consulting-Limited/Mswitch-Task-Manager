'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ActivityLogViewer } from '@/components/shared/activity-log-viewer'
import { toast } from 'sonner'

interface Member {
  id: string
  name: string
  email: string
  role: string
}

interface UnitData {
  id: string
  name: string
  description: string | null
  lead: { id: string; name: string; email: string } | null
  members: Member[]
  _count: { monthlyGoals: number }
}

export default function EditUnitPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [unit, setUnit] = useState<UnitData | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [leadId, setLeadId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/units/${id}`)
        if (!res.ok) throw new Error('Unit not found')
        const data: UnitData = await res.json()
        setUnit(data)
        setName(data.name)
        setDescription(data.description || '')
        setLeadId(data.lead?.id || '')
      } catch {
        toast.error('Failed to load unit')
        router.push('/units')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, leadId: leadId || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update unit')
      }
      toast.success('Unit updated')
      router.push('/units')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Loading...</div>
  }
  if (!unit) return null

  const leadOptions = [
    { value: '', label: 'No lead' },
    ...unit.members.map(m => ({ value: m.id, label: `${m.name} (${m.email})` })),
  ]

  return (
    <div>
      <PageHeader title={`Edit: ${unit.name}`} description="Update unit information" />
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Unit Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter unit name" required />
            <Input label="Description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            <Select label="Lead" id="leadId" value={leadId} onChange={(e) => setLeadId(e.target.value)} options={leadOptions} placeholder="Select lead" />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/units')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
        <CardContent>
          <ActivityLogViewer entityType="UNIT" entityId={unit.id} />
        </CardContent>
      </Card>
    </div>
  )
}

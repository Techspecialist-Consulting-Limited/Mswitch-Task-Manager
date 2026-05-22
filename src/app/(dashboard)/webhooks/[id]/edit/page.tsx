'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface WebhookData {
  id: string
  name: string
  url: string
  events: string
  secret: string | null
  active: boolean
}

export default function EditWebhookPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [webhook, setWebhook] = useState<WebhookData | null>(null)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState('')
  const [secret, setSecret] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/webhooks/${id}`)
        if (!res.ok) throw new Error('Webhook not found')
        const data: WebhookData = await res.json()
        setWebhook(data)
        setName(data.name)
        setUrl(data.url)
        setEvents(data.events)
        setSecret(data.secret || '')
        setActive(data.active)
      } catch {
        toast.error('Failed to load webhook')
        router.push('/webhooks')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim() || !events.trim()) {
      toast.error('Name, URL, and events are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          events: events.trim(),
          secret: secret.trim() || null,
          active,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update webhook')
      }
      toast.success('Webhook updated')
      router.push('/webhooks')
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
  if (!webhook) return null

  return (
    <div>
      <PageHeader title={`Edit: ${webhook.name}`} description="Update webhook configuration" />
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Webhook Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Slack Notifications" required />
            <Input label="URL" id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.example.com/..." required />
            <Input label="Events" id="events" value={events} onChange={(e) => setEvents(e.target.value)} placeholder="task.created,task.updated" required />
            <Input label="Secret" id="secret" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="HMAC secret for verification" />
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-zinc-300" />
              Active
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/webhooks')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

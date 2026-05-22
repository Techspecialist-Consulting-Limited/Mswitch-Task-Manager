'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function NewWebhookPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState('')
  const [secret, setSecret] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim() || !events.trim()) {
      toast.error('Name, URL, and events are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          events: events.trim(),
          secret: secret.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create webhook')
      }
      toast.success('Webhook created')
      router.push('/webhooks')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="New Webhook" description="Create a new outgoing webhook" />
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Webhook Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Slack Notifications" required />
            <Input label="URL" id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.example.com/..." required />
            <Input label="Events" id="events" value={events} onChange={(e) => setEvents(e.target.value)} placeholder="task.created,task.updated" required />
            <Input label="Secret (optional)" id="secret" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="HMAC secret for verification" />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Webhook'}</Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

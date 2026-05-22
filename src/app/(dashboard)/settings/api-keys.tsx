'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Key, Copy, Trash2, Check, Eye, EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ApiKeyData {
  id: string
  name: string
  key: string
  active: boolean
  lastUsed: string | null
  createdAt: string
}

export function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyData[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/api-keys')
        if (res.ok) {
          const data = await res.json()
          setKeys(data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleGenerate() {
    if (!newKeyName.trim()) {
      toast.error('Key name is required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create key')
      }
      const data = await res.json()
      setGeneratedKey(data.key)
      setKeys((prev) => [data, ...prev])
      setNewKeyName('')
      setShowNewForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(key: ApiKeyData) {
    try {
      const res = await fetch(`/api/api-keys/${key.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !key.active }),
      })
      if (!res.ok) throw new Error('Failed to toggle key')
      setKeys((prev) => prev.map((k) => (k.id === key.id ? { ...k, active: !k.active } : k)))
      toast.success(key.active ? 'Key deactivated' : 'Key activated')
    } catch {
      toast.error('Failed to toggle key')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this API key?')) return
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete key')
      setKeys((prev) => prev.filter((k) => k.id !== id))
      toast.success('Key deleted')
    } catch {
      toast.error('Failed to delete key')
    }
  }

  function copyToClipboard() {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>API Keys</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => setShowNewForm(true)}>
            <Key className="h-3.5 w-3.5" />
            Generate New Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-zinc-400">Loading keys...</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-zinc-400">No API keys yet.</p>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{key.name}</span>
                    <Badge variant={key.active ? 'success' : 'default'}>{key.active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {key.lastUsed ? `Last used ${formatDate(key.lastUsed)}` : 'Never used'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(key)}>
                    {key.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(key.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Modal open={showNewForm} onClose={() => setShowNewForm(false)} title="Generate New API Key" description="Create a new API key for programmatic access">
        <div className="space-y-4">
          <Input label="Key Name" id="keyName" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. CI/CD Pipeline" />
          <Button onClick={handleGenerate} disabled={creating || !newKeyName.trim()} className="w-full">
            {creating ? 'Generating...' : 'Generate Key'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!generatedKey} onClose={() => { setGeneratedKey(null); setCopied(false) }} title="API Key Generated" description="Copy this key now. You won't be able to see it again.">
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="break-all font-mono text-sm text-zinc-800">{generatedKey}</p>
          </div>
          <Button onClick={copyToClipboard} className="w-full" variant={copied ? 'success' : 'primary'}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}

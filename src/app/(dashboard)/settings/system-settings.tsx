'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SettingRow {
  key: string
  value: string
  editing: boolean
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SettingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [testingSmtp, setTestingSmtp] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data: Record<string, string> = await res.json()
          setSettings(Object.entries(data).map(([key, value]) => ({ key, value, editing: false })))
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function toggleEditing(key: string) {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, editing: !s.editing } : s))
  }

  function updateValue(key: string, value: string) {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  async function saveSetting(key: string) {
    const setting = settings.find(s => s.key === key)
    if (!setting) return
    setSavingKey(key)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: setting.value }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      toast.success('Setting saved')
      toggleEditing(key)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSavingKey(null)
    }
  }

  async function testSmtp() {
    setTestingSmtp(true)
    try {
      const res = await fetch('/api/settings/smtp', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Test email sent successfully')
      } else {
        toast.error(data.error || 'Test failed')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setTestingSmtp(false)
    }
  }

  const smtpFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']
  const generalSettings = settings.filter(s => !smtpFields.includes(s.key))
  const smtpSettings = settings.filter(s => smtpFields.includes(s.key))

  const smtpLabels: Record<string, string> = {
    smtp_host: 'Host',
    smtp_port: 'Port',
    smtp_user: 'Username',
    smtp_pass: 'Password',
    smtp_from: 'From Email',
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-lg">
        <CardHeader><CardTitle>System Settings</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-400">Loading settings...</p>
          ) : generalSettings.length === 0 ? (
            <p className="text-sm text-zinc-400">No settings configured yet.</p>
          ) : (
            <div className="space-y-3">
              {generalSettings.map((s) => (
                <div key={s.key} className="rounded-lg border border-zinc-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{s.key}</span>
                    {!s.editing ? (
                      <Button variant="ghost" size="sm" onClick={() => toggleEditing(s.key)}>Edit</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => toggleEditing(s.key)}>Cancel</Button>
                    )}
                  </div>
                  {s.editing ? (
                    <div className="mt-2 flex gap-2">
                      <Input value={s.value} onChange={(e) => updateValue(s.key, e.target.value)} />
                      <Button size="sm" onClick={() => saveSetting(s.key)} disabled={savingKey === s.key}>
                        {savingKey === s.key ? '...' : 'Save'}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-700">{s.key === 'smtp_pass' ? '••••••••' : s.value}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader><CardTitle>SMTP Configuration</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {smtpFields.map(key => {
              const s = smtpSettings.find(x => x.key === key)
              const value = s?.value || ''
              const editing = s?.editing || false
              return (
                <div key={key} className="rounded-lg border border-zinc-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{smtpLabels[key]}</span>
                    {!editing ? (
                      <Button variant="ghost" size="sm" onClick={() => toggleEditing(key)}>Edit</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => toggleEditing(key)}>Cancel</Button>
                    )}
                  </div>
                  {editing ? (
                    <div className="mt-2 flex gap-2">
                      <Input
                        type={key === 'smtp_pass' ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => updateValue(key, e.target.value)}
                      />
                      <Button size="sm" onClick={() => saveSetting(key)} disabled={savingKey === key}>
                        {savingKey === key ? '...' : 'Save'}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-700">{key === 'smtp_pass' ? '••••••••' : (value || 'Not set')}</p>
                  )}
                </div>
              )
            })}
            <Button onClick={testSmtp} disabled={testingSmtp} className="mt-2">
              {testingSmtp ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

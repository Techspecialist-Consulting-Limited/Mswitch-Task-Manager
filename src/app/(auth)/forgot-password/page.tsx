'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return }
      setSent(true)
    } catch { setError('Something went wrong') } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900">Reset password</h1>
          <p className="mt-1 text-sm text-zinc-500">Enter your email to receive a reset link</p>
        </div>
        {sent ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">If an account exists, a reset link has been sent.</div>
            <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="email" type="email" label="Email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</Button>
            <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
          </form>
        )}
      </div>
    </div>
  )
}

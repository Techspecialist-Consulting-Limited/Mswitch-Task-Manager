'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const token = sp.get('token')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900">Invalid reset link</h1>
          <p className="mt-2 text-sm text-zinc-500">This link is invalid or has expired.</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-sm text-zinc-900 underline">Request a new link</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900">Password reset</h1>
          <p className="mt-2 text-sm text-zinc-500">Your password has been reset.</p>
          <Link href="/login" className="mt-4 inline-block text-sm text-zinc-900 underline">Sign in</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm = form.get('confirm') as string
    if (password !== confirm) { setError('Passwords do not match'); setLoading(false); return }
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to reset password'); setLoading(false); return }
    setSuccess(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900"><Target className="h-6 w-6 text-white" /></div>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900">Set new password</h1>
          <p className="mt-1 text-sm text-zinc-500">Enter your new password</p>
        </div>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="password" name="password" type="password" label="New Password" placeholder="At least 6 characters" required minLength={6} />
          <Input id="confirm" name="confirm" type="password" label="Confirm Password" placeholder="Repeat your password" required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>
}

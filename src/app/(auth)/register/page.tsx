'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Target } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [units, setUnits] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/units').then(r => r.json()).then(d => setUnits(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const email = form.get('email') as string
    const password = form.get('password') as string
    const confirm = form.get('confirmPassword') as string
    const unitId = form.get('unitId') as string
    if (password !== confirm) { setError('Passwords do not match'); setLoading(false); return }
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, unitId: unitId || undefined }),
      })
      if (!res.ok) {
        let errMsg = 'Registration failed'
        try { const d = await res.json(); errMsg = d.error || errMsg } catch { errMsg = `Server error (${res.status})` }
        setError(errMsg); setLoading(false); return
      }
      router.push('/login?registered=true')
    } catch {
      setError('Network error — please check your connection and try again')
      setLoading(false)
    }
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
          <h1 className="text-2xl font-semibold text-zinc-900">Create account</h1>
          <p className="mt-1 text-sm text-zinc-500">Get started with TaskFlow</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="name" name="name" label="Full Name" placeholder="John Doe" required />
          <Input id="email" name="email" type="email" label="Email" placeholder="name@company.com" required />
          <Input id="password" name="password" type="password" label="Password" placeholder="At least 6 characters" required minLength={6} />
          <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirm Password" placeholder="Repeat your password" required />
          <Select id="unitId" name="unitId" label="Unit (optional)" options={units.map(u => ({ value: u.id, label: u.name }))} placeholder="Select your unit" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account? <Link href="/login" className="font-medium text-zinc-900 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

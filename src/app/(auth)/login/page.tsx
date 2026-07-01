'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const registered = sp.get('registered') === 'true'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email') as string,
      password: form.get('password') as string,
      redirect: false,
    })
    if (result?.error) { setError('Invalid email or password'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to TaskFlow</p>
        </div>
        {registered && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Account created. Please sign in.</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="email" name="email" type="email" label="Email" placeholder="name@company.com" required />
          <Input id="password" name="password" type="password" label="Password" placeholder="Enter your password" required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800">Forgot password?</Link>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account? <Link href="/register" className="font-medium text-indigo-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}

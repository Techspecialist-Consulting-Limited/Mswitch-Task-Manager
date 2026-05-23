import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-zinc-900">TaskFlow</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Log in</Link>
          <Link href="/register" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Sign up</Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Goals, tasks, and weekly updates — all in one place.
          </h1>
          <p className="mt-4 text-lg text-zinc-500">
            TaskFlow helps teams set monthly goals, break them into weekly actions, track progress, and stay aligned — without the noise.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/register" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 shadow-sm">
              Get started
            </Link>
            <Link href="/login" className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Log in
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="mx-auto mt-24 w-full max-w-4xl">
          <h2 className="text-center text-xl font-semibold text-zinc-900">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-lg font-semibold text-zinc-900">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-medium text-zinc-900">{step.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="mx-auto mt-24 w-full max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-medium text-zinc-900">{f.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center text-sm text-zinc-400">
          &copy; {new Date().getFullYear()} TaskFlow. All rights reserved.
        </footer>
      </main>
    </div>
  )
}

const steps = [
  {
    title: 'Create monthly goals',
    description: 'Set clear objectives for your team or yourself each month.',
  },
  {
    title: 'Break into weekly goals',
    description: 'Divide each goal into manageable weekly milestones.',
  },
  {
    title: 'Submit weekly updates',
    description: 'Log progress, track blockers, and keep everyone informed.',
  },
]

const features = [
  {
    title: 'Task management',
    description: 'Assign, track, and manage tasks across your team with status updates and deadlines.',
    icon: <svg className="h-5 w-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    title: 'Progress tracking',
    description: 'Visual progress bars and dashboards show exactly where things stand.',
    icon: <svg className="h-5 w-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  },
  {
    title: 'Team visibility',
    description: 'Unit leads and admins can view progress across their entire team.',
    icon: <svg className="h-5 w-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  },
  {
    title: 'Role-based access',
    description: 'Staff, unit leads, and admins each see what they need to see.',
    icon: <svg className="h-5 w-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  },
]

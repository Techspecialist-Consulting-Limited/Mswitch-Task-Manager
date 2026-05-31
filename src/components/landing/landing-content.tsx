'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  CheckSquare, BarChart3, Users, Shield,
  ArrowRight, Sparkles, ChevronDown,
} from 'lucide-react'

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function AnimatedSection({
  children,
  className,
  delay = 0,
  threshold = 0.1,
}: {
  children: ReactNode
  className?: string
  delay?: number
  threshold?: number
}) {
  const { ref, isVisible } = useInView(threshold)

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function FloatingObjects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Drifting filled circles */}
      <div className="absolute left-[10%] top-[20%] h-4 w-4 animate-drift rounded-full bg-zinc-300/60" />
      <div className="absolute right-[15%] top-[30%] h-3 w-3 animate-drift-reverse rounded-full bg-zinc-400/50" style={{ animationDuration: '14s' }} />
      <div className="absolute left-[20%] top-[60%] h-5 w-5 animate-drift rounded-full bg-zinc-300/40" style={{ animationDuration: '18s' }} />
      <div className="absolute right-[10%] top-[65%] h-2 w-2 animate-drift-reverse rounded-full bg-zinc-400/60" style={{ animationDuration: '16s' }} />

      {/* Floating dots */}
      <div className="absolute left-[5%] top-[40%] h-1.5 w-1.5 animate-float rounded-full bg-zinc-400/70" style={{ animationDelay: '0s' }} />
      <div className="absolute right-[8%] top-[50%] h-2 w-2 animate-float rounded-full bg-zinc-300/60" style={{ animationDelay: '1.2s' }} />
      <div className="absolute left-[40%] top-[15%] h-1 w-1 animate-float rounded-full bg-zinc-400/80" style={{ animationDelay: '0.6s' }} />
      <div className="absolute right-[30%] top-[80%] h-1.5 w-1.5 animate-float rounded-full bg-zinc-300/70" style={{ animationDelay: '1.8s' }} />

      {/* Bordered ring shapes */}
      <div className="absolute left-[30%] top-[30%] h-10 w-10 animate-drift rounded-full border-2 border-zinc-300/40" style={{ animationDuration: '22s' }} />
      <div className="absolute right-[20%] bottom-[25%] h-8 w-8 animate-drift-reverse rounded-full border-2 border-zinc-400/30" style={{ animationDuration: '20s' }} />

      {/* Rotating squares */}
      <div className="absolute left-[50%] top-[75%]">
        <div className="h-6 w-6 animate-spin-slow border-2 border-zinc-300/40" style={{ animationDuration: '25s' }} />
      </div>
      <div className="absolute right-[25%] top-[15%]">
        <div className="h-4 w-4 animate-spin-slow border-2 border-zinc-400/30" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
      </div>

      {/* Swaying pill shapes */}
      <div className="absolute left-[60%] top-[45%] h-1.5 w-10 animate-sway rounded-full bg-zinc-300/40" />
      <div className="absolute right-[5%] top-[40%] h-1 w-8 animate-sway rounded-full bg-zinc-400/30" style={{ animationDelay: '0.8s' }} />

      {/* Large faint circles */}
      <div className="absolute left-[50%] top-[5%] h-40 w-40 animate-drift rounded-full border border-zinc-200/20" style={{ animationDuration: '25s' }} />
      <div className="absolute right-[5%] bottom-[5%] h-32 w-32 animate-drift-reverse rounded-full border border-zinc-200/15" style={{ animationDuration: '28s' }} />
    </div>
  )
}

export default function LandingContent() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Sticky nav */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-zinc-200/50 bg-white/80 shadow-xs backdrop-blur-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-zinc-900">
              TaskFlow
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="relative text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-zinc-900 after:transition-all hover:after:w-full"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-800 hover:shadow-md active:scale-[0.97]"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        {/* Subtle background atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-zinc-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-zinc-100/30 blur-3xl" />

        <FloatingObjects />

        <div className="relative mx-auto max-w-3xl text-center">
          <AnimatedSection>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-4 py-1.5 text-sm text-zinc-600">
              <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
              Streamline your team&apos;s workflow
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
              Goals, tasks, and{' '}
              <span className="animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-transparent">
                weekly updates
              </span>
              <br />
              all in one place.
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500 sm:text-xl">
              TaskFlow helps teams set monthly goals, break them into weekly
              actions, track progress, and stay aligned — without the noise.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-7 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg active:scale-[0.97]"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                <span className="absolute inset-0 rounded-lg ring-2 ring-zinc-900/20 ring-offset-2 transition-all duration-200 group-hover:ring-zinc-700/30" />
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 bg-white px-7 py-3.5 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm active:scale-[0.97]"
              >
                Log in
              </Link>
            </div>
          </AnimatedSection>
        </div>

        {/* Scroll indicator */}
        <AnimatedSection delay={500}>
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-pulse-soft text-zinc-400">
            <ChevronDown className="h-5 w-5 animate-float" />
          </div>
        </AnimatedSection>
      </section>

      {/* How it works */}
      <section className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="text-center">
            <span className="inline-block rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
              How it works
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Three simple steps
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-500">
              From setting goals to tracking progress — TaskFlow makes it
              effortless.
            </p>
          </AnimatedSection>

          <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div
                    className="absolute top-8 left-[60%] hidden h-px w-[80%] sm:block"
                    style={{
                      background:
                        'linear-gradient(to right, rgb(39 39 42), rgb(63 63 70))',
                      opacity: 0.2,
                    }}
                  />
                )}
                <AnimatedSection delay={i * 150}>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-bold text-white shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-xl">
                    {i + 1}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-zinc-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {step.description}
                  </p>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative bg-zinc-50/50 px-6 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl">
          <AnimatedSection className="text-center">
            <span className="inline-block rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
              Features
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Everything you need
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-500">
              Built for teams that want clarity, accountability, and momentum.
            </p>
          </AnimatedSection>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="group relative rounded-xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors duration-300 group-hover:bg-zinc-200">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-900">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                    {f.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.03)_0%,transparent_60%)]" />
        <AnimatedSection className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Ready to streamline your workflow?
          </h2>
          <p className="mt-4 text-lg text-zinc-500">
            Join thousands of teams that use TaskFlow to stay organized and
            aligned.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-7 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg active:scale-[0.97]"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 bg-white px-7 py-3.5 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm active:scale-[0.97]"
            >
              Log in
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Sparkles className="h-3.5 w-3.5" />
            <span>TaskFlow</span>
          </div>
          <p className="text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} TaskFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

const steps = [
  {
    title: 'Create monthly goals',
    description:
      'Set clear objectives for your team or yourself each month. Define what success looks like.',
  },
  {
    title: 'Break into weekly goals',
    description:
      'Divide each goal into manageable weekly milestones. Keep momentum going all month.',
  },
  {
    title: 'Submit weekly updates',
    description:
      'Log progress, track blockers, and keep everyone informed with regular check-ins.',
  },
]

const features = [
  {
    title: 'Task management',
    description:
      'Assign, track, and manage tasks across your team with status updates, deadlines, and priorities.',
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    title: 'Progress tracking',
    description:
      'Visual progress bars and dashboards show exactly where things stand at a glance.',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: 'Team visibility',
    description:
      'Unit leads and admins can view progress across their entire team with drill-down detail.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Role-based access',
    description:
      'Staff, unit leads, and admins each see what they need. Permissions are simple and secure.',
    icon: <Shield className="h-5 w-5" />,
  },
]

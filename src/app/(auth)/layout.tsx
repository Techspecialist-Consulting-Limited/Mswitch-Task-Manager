import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Link
        href="/"
        className="absolute left-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/80 px-3 py-1.5 text-sm text-zinc-600 shadow-sm backdrop-blur-sm transition-all hover:border-zinc-300 hover:bg-white hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      {children}
    </div>
  )
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    TODO: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return map[status] || 'bg-zinc-100 text-zinc-600 border-zinc-200'
}

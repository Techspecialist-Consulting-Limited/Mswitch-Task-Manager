'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'
import { LayoutDashboard, Target, CheckSquare, Building2, Users, Settings, Trash2, ChevronLeft, ChevronRight, X, Columns, type LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Target, CheckSquare, Building2, Users, Settings, Trash2, Columns,
}

function closeMobile() {
  if (window.innerWidth < 768) useSidebarStore.getState().setOpen(false)
}

interface SidebarProps { role: string }

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, toggle, setOpen } = useSidebarStore()

  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/calendar', label: 'Calendar', icon: 'Calendar' },
    { href: '/goals', label: 'Goals', icon: 'Target' },
    { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
    { href: '/tasks/kanban', label: 'Board', icon: 'Columns' },
    { href: '/units', label: 'Units', icon: 'Building2' },
    ...(role === 'SUPER_ADMIN' ? [{ href: '/users', label: 'Users', icon: 'Users' as string }] : []),
    ...(role === 'SUPER_ADMIN' ? [{ href: '/trash', label: 'Trash', icon: 'Trash2' as string }] : []),
    { href: '/settings', label: 'Settings', icon: 'Settings' },
  ]

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setOpen(false)}
      />
      <aside className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-200 bg-white transition-all duration-300',
        isOpen ? 'w-60 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
      )}>
        <div className="flex h-16 items-center border-b border-zinc-100 px-4">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={closeMobile}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
              <Target className="h-4 w-4 text-white" />
            </div>
            {isOpen && <span className="text-sm font-semibold text-zinc-900">TaskFlow</span>}
          </Link>
          <button onClick={() => setOpen(false)} className="ml-auto rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const Icon = iconMap[item.icon]
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} onClick={closeMobile} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900')}>
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {isOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-zinc-100 p-3">
          <button onClick={toggle} className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600">
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}

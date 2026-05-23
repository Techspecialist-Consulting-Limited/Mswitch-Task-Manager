'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, CheckCheck, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  read: boolean
  createdAt: string
}

const typeIcon: Record<string, typeof Bell> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
}

const typeColor: Record<string, string> = {
  INFO: 'text-blue-500',
  SUCCESS: 'text-emerald-500',
  WARNING: 'text-amber-500',
  ERROR: 'text-red-500',
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?page=1')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // silently fail — notifications are non-critical
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleMarkRead = async (id: string, link?: string | null) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      setOpen(false)
      if (link) router.push(link)
    } catch {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-900">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
                <CheckCheck className="h-3.5 w-3.5" />
                {markingAll ? '...' : 'Mark all read'}
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                  <Bell className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-500">No notifications</p>
                <p className="mt-0.5 text-xs text-zinc-400">You&apos;re all caught up.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcon[n.type] || Info
                return (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n.id, n.link)}
                    className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-50 last:border-b-0 ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`mt-0.5 ${typeColor[n.type] || 'text-blue-500'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${n.read ? 'text-zinc-600' : 'font-semibold text-zinc-900'}`}>{n.title}</p>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      </div>
                      {n.message && (
                        <p className={`mt-0.5 text-xs leading-relaxed line-clamp-2 ${n.read ? 'text-zinc-400' : 'text-zinc-500'}`}>{n.message}</p>
                      )}
                      <p className="mt-1 text-[10px] text-zinc-400">{formatDate(n.createdAt)}</p>
                    </div>
                    {n.link && <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-300" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

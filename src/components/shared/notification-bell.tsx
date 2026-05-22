'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'

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
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?unreadOnly=true&page=1')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silently fail
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
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setOpen(false)
      if (link) router.push(link)
    } catch {
      toast.error('Failed to dismiss notification')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setUnreadCount(0)
      setNotifications([])
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
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
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Bell className="mb-2 h-6 w-6 text-zinc-300" />
                <p className="text-sm text-zinc-400">No new notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => {
                const Icon = typeIcon[n.type] || Info
                return (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n.id, n.link)}
                    className="flex w-full gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                  >
                    <div className={`mt-0.5 ${typeColor[n.type] || 'text-blue-500'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{n.title}</p>
                      {n.message && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{n.message}</p>}
                    </div>
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

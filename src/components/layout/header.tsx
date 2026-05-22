'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/shared/notification-bell'
import { LogOut, Menu, User } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar-store'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  unitName: string | null
}

export function Header() {
  const router = useRouter()
  const { data: session } = useSession()
  const { setOpen } = useSidebarStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) return
    async function load() {
      const res = await fetch(`/api/users/${uid}`)
      if (res.ok) {
        const data = await res.json()
        setProfile({ id: data.id, name: data.name, email: data.email, role: data.role, unitName: data.unit?.name ?? null })
      }
    }
    load()
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user) {
      setProfile({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: (session.user as { role: string }).role,
        unitName: (session.user as { unitName: string | null }).unitName,
      })
    }
  }, [session])

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm text-zinc-400">
          {profile?.role === 'SUPER_ADMIN' ? 'Admin' : profile?.role === 'UNIT_LEAD' ? 'Lead' : 'Staff'}
          {profile?.unitName ? ` · ${profile.unitName}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {profile && <NotificationBell />}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-100">
            <Avatar name={profile?.name || 'User'} size="sm" />
            <span className="hidden text-sm font-medium text-zinc-700 sm:block">{profile?.name}</span>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-zinc-200 bg-white py-2 shadow-lg">
                <div className="border-b border-zinc-100 px-4 py-2">
                  <p className="text-sm font-medium text-zinc-900">{profile?.name}</p>
                  <p className="text-xs text-zinc-500">{profile?.email}</p>
                </div>
                <Link href="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                  <User className="h-4 w-4" /> Profile Settings
                </Link>
                <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

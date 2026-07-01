'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/shared/notification-bell'
import { LogOut, Menu, User, Building2, ChevronDown } from 'lucide-react'
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

function RoleLabel({ role }: { role: string }) {
  if (role === 'SUPER_ADMIN') return <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">Admin</span>
  if (role === 'UNIT_LEAD') return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">Lead</span>
  return <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">Staff</span>
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 md:hidden transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        {profile?.unitName && (
          <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1">
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-700">{profile.unitName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {profile && <NotificationBell />}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200"
          >
            <Avatar name={profile?.name || 'User'} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-zinc-800 leading-tight">{profile?.name}</p>
              {profile && <RoleLabel role={profile.role} />}
            </div>
            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-zinc-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg ring-1 ring-black/5">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <p className="text-sm font-semibold text-zinc-900">{profile?.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{profile?.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <User className="h-4 w-4 text-zinc-400" /> Profile Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
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

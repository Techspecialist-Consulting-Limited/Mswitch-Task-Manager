'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ROLE_LABELS } from '@/lib/constants'
import { UserActions } from './user-actions'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  unitId: string | null
  unitName: string | null
}

interface UnitOption {
  id: string
  name: string
}

interface UsersListProps {
  users: UserItem[]
  units: UnitOption[]
}

export function UsersList({ users, units }: UsersListProps) {
  const [search, setSearch] = useState('')

  const filtered = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filtered.map((u) => (
        <div key={u.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={u.name} size="sm" />
            <div>
              <p className="text-sm font-medium text-zinc-900">{u.name}</p>
              <p className="text-xs text-zinc-500">{u.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={!u.isActive ? 'danger' : u.role === 'SUPER_ADMIN' ? 'info' : u.role === 'UNIT_LEAD' ? 'purple' : 'default'}>
              {!u.isActive ? 'Inactive' : ROLE_LABELS[u.role] || u.role}
            </Badge>
            <UserActions userId={u.id} currentRole={u.role} isActive={u.isActive} currentUnitId={u.unitId} units={units} />
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <p className="text-sm text-zinc-400 text-center py-4">No users found</p>
      )}
    </div>
  )
}

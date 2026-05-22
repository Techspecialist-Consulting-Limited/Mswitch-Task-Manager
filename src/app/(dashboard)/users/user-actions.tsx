'use client'

import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ROLES, ROLE_LABELS } from '@/lib/constants'

interface UserActionsProps {
  userId: string
  currentRole: string
  isActive: boolean
}

const roleOptions = [
  { value: ROLES.STAFF, label: ROLE_LABELS[ROLES.STAFF] },
  { value: ROLES.UNIT_LEAD, label: ROLE_LABELS[ROLES.UNIT_LEAD] },
  { value: ROLES.SUPER_ADMIN, label: ROLE_LABELS[ROLES.SUPER_ADMIN] },
]

export function UserActions({ userId, currentRole, isActive }: UserActionsProps) {
  const [role, setRole] = useState(currentRole)
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)

  async function handleRoleChange(newRole: string) {
    setRole(newRole)
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }
      toast.success('Role updated')
    } catch (err) {
      setRole(currentRole)
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive() {
    setActive(!active)
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !active }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update user')
      }
      toast.success(active ? 'User deactivated' : 'User activated')
    } catch (err) {
      setActive(active)
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={role}
        onChange={(e) => handleRoleChange(e.target.value)}
        options={roleOptions}
        disabled={loading}
        className="w-40"
      />
      <Button
        variant={active ? 'danger' : 'success'}
        size="sm"
        onClick={handleToggleActive}
        disabled={loading}
      >
        {active ? 'Deactivate' : 'Activate'}
      </Button>
    </div>
  )
}

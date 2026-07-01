import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/constants'
import { canManageUsers } from '@/lib/permissions'
import { UsersList } from './users-list'

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!canManageUsers(session.user.role)) redirect('/dashboard')

  const [users, units] = await Promise.all([
    prisma.user.findMany({
      include: { unit: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.unit.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const serialized = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    unitId: u.unit?.id || null,
    unitName: u.unit?.name || null,
  }))

  return (
    <div>
      <PageHeader title="Users" description="Manage all users in the system" />
      <Card>
        <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
        <CardContent>
          <UsersList users={serialized} units={units} />
        </CardContent>
      </Card>
    </div>
  )
}

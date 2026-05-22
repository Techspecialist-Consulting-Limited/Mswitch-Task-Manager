import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAssignTasks } from '@/lib/permissions'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, unitId } = session.user
  const where: Record<string, unknown> = {}
  if (role === 'UNIT_LEAD' && unitId) where.unitId = unitId
  else if (!canAssignTasks(role)) where.id = session.user.id

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, unit: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(users)
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isUnitMember } from '@/lib/permissions'

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')

  // Per-goal activity is visible to that goal's team; everything else is admin-only.
  if (entityType === 'GOAL' && entityId) {
    const goal = await prisma.monthlyGoal.findUnique({ where: { id: entityId }, select: { unitId: true } })
    if (!goal || !isUnitMember(session.user, goal.unitId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const where: Record<string, unknown> = {}
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where }),
  ])

  return NextResponse.json({
    logs,
    totalPages: Math.ceil(total / PAGE_SIZE),
    currentPage: page,
  })
}

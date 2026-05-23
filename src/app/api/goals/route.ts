export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canCreateGoals } from '@/lib/permissions'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId, unitId } = session.user
  const where: Record<string, unknown> = { deletedAt: null }
  if (role === 'STAFF') where.userId = userId
  else if (role === 'UNIT_LEAD' && unitId) where.unitId = unitId

  const goals = await prisma.monthlyGoal.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { weeklyGoals: true } },
      weeklyGoals: {
        include: { weeklyUpdates: { select: { progressPercentage: true } } },
      },
    },
    orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
  })

  const goalsWithProgress = goals.map(g => {
    const allPercentages = g.weeklyGoals.flatMap(wg => wg.weeklyUpdates.map(u => u.progressPercentage))
    const progress = allPercentages.length > 0
      ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
      : 0
    const { weeklyGoals, ...rest } = g
    return { ...rest, progress }
  })

  return NextResponse.json(goalsWithProgress)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCreateGoals(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, month } = await request.json()
  if (!title || !month) return NextResponse.json({ error: 'Title and month are required' }, { status: 400 })

  const goal = await prisma.monthlyGoal.create({
    data: {
      title,
      description: description || null,
      month,
      userId: session.user.id,
      unitId: session.user.unitId,
    },
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json(goal)
}

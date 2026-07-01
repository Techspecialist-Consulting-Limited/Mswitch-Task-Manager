export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canCreateGoals } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role, unitId } = session.user
    const where: Record<string, unknown> = { deletedAt: null }
    if (role !== 'SUPER_ADMIN') {
      if (!unitId) return NextResponse.json([])
      where.unitId = unitId
    }

    const goals = await prisma.monthlyGoal.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { weeklyGoals: true } },
        weeklyGoals: {
          include: { weeklyUpdates: { select: { progressPercentage: true, user: { select: { id: true, name: true } } } } },
        },
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
    })

    const goalsWithProgress = goals.map(g => {
      const allUpdates = g.weeklyGoals.flatMap(wg => wg.weeklyUpdates)
      const percentages = allUpdates.map(u => u.progressPercentage)
      const progress = percentages.length > 0
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : 0
      const contributors = Array.from(new Map(allUpdates.map(u => [u.user.id, u.user])).values())
      const { weeklyGoals, ...rest } = g
      return { ...rest, progress, contributors }
    })

    return NextResponse.json(goalsWithProgress)
  } catch (err) {
    console.error('Goals GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!canCreateGoals(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { unitId } = session.user
    if (!unitId) {
      return NextResponse.json({ error: 'You are not assigned to a team yet. Ask an admin to assign you before creating a team report.' }, { status: 400 })
    }

    const { title, description, month } = await request.json()
    if (!title || !month) return NextResponse.json({ error: 'Title and month are required' }, { status: 400 })

    const goal = await prisma.monthlyGoal.create({
      data: {
        title,
        description: description || null,
        month,
        createdById: session.user.id,
        unitId,
      },
      include: { createdBy: { select: { name: true } } },
    })

    await logActivity('CREATED', 'GOAL', goal.id, session.user.id, session.user.name ?? 'Unknown', { title: goal.title, month: goal.month })

    return NextResponse.json(goal)
  } catch (err) {
    console.error('Goals POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

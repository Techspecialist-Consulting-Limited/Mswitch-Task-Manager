export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const monthlyGoalId = searchParams.get('monthlyGoalId')
  if (!monthlyGoalId) return NextResponse.json({ error: 'monthlyGoalId is required' }, { status: 400 })

  const goal = await prisma.monthlyGoal.findUnique({ where: { id: monthlyGoalId }, select: { userId: true, unitId: true } })
  if (!goal) return NextResponse.json({ error: 'Monthly goal not found' }, { status: 404 })

  const { role, id: userId, unitId } = session.user
  const canView = role === 'SUPER_ADMIN' || goal.userId === userId || (role === 'UNIT_LEAD' && goal.unitId === unitId)
  if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const weeklyGoals = await prisma.weeklyGoal.findMany({
    where: { monthlyGoalId },
    orderBy: { weekNumber: 'asc' },
  })
  return NextResponse.json(weeklyGoals)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { monthlyGoalId, weekNumber, title, description } = await request.json()
  if (!monthlyGoalId || !weekNumber || !title) {
    return NextResponse.json({ error: 'monthlyGoalId, weekNumber, and title are required' }, { status: 400 })
  }
  if (weekNumber < 1 || weekNumber > 4) {
    return NextResponse.json({ error: 'weekNumber must be between 1 and 4' }, { status: 400 })
  }

  const goal = await prisma.monthlyGoal.findUnique({ where: { id: monthlyGoalId }, select: { userId: true, unitId: true } })
  if (!goal) return NextResponse.json({ error: 'Monthly goal not found' }, { status: 404 })

  const { role, id: userId, unitId } = session.user
  const canCreate = role === 'SUPER_ADMIN' || goal.userId === userId || (role === 'UNIT_LEAD' && goal.unitId === unitId)
  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.weeklyGoal.findFirst({ where: { monthlyGoalId, weekNumber } })
  if (existing) return NextResponse.json({ error: `Week ${weekNumber} already exists for this goal` }, { status: 409 })

  const weeklyGoal = await prisma.weeklyGoal.create({
    data: { weekNumber, title, description: description || null, monthlyGoalId },
  })
  return NextResponse.json(weeklyGoal)
}

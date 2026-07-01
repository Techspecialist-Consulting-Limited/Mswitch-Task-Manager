export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isUnitMember } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const wg = await prisma.weeklyGoal.findUnique({ where: { id }, include: { monthlyGoal: { select: { unitId: true } } } })
  if (!wg) return NextResponse.json({ error: 'Weekly goal not found' }, { status: 404 })

  if (!isUnitMember(session.user, wg.monthlyGoal.unitId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, weekNumber, status } = await request.json()
  if (weekNumber !== undefined && (weekNumber < 1 || weekNumber > 4)) {
    return NextResponse.json({ error: 'weekNumber must be between 1 and 4' }, { status: 400 })
  }

  if (weekNumber !== undefined && weekNumber !== wg.weekNumber) {
    const dup = await prisma.weeklyGoal.findFirst({ where: { monthlyGoalId: wg.monthlyGoalId, weekNumber, id: { not: id } } })
    if (dup) return NextResponse.json({ error: `Week ${weekNumber} already exists` }, { status: 409 })
  }

  const updated = await prisma.weeklyGoal.update({
    where: { id },
    data: { ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(weekNumber !== undefined && { weekNumber }), ...(status !== undefined && { status }) },
  })

  await logActivity('UPDATED', 'WEEKLY_GOAL', wg.id, session.user.id, session.user.name ?? 'Unknown')

  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const wg = await prisma.weeklyGoal.findUnique({ where: { id }, include: { monthlyGoal: { select: { unitId: true } } } })
  if (!wg) return NextResponse.json({ error: 'Weekly goal not found' }, { status: 404 })

  if (!isUnitMember(session.user, wg.monthlyGoal.unitId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.weeklyGoal.delete({ where: { id } })

  await logActivity('DELETED', 'WEEKLY_GOAL', wg.id, session.user.id, session.user.name ?? 'Unknown', { title: wg.title })

  return NextResponse.json({ success: true })
}

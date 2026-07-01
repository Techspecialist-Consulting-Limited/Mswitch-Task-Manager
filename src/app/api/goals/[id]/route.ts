export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isUnitMember } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const goal = await prisma.monthlyGoal.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      weeklyGoals: { include: { _count: { select: { weeklyUpdates: true } } }, orderBy: { weekNumber: 'asc' } },
    },
  })
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  if (!isUnitMember(session.user, goal.unitId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(goal)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const goal = await prisma.monthlyGoal.findUnique({ where: { id } })
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  if (!isUnitMember(session.user, goal.unitId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, month, status } = await request.json()
  const updated = await prisma.monthlyGoal.update({
    where: { id },
    data: { ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(month !== undefined && { month }), ...(status !== undefined && { status }) },
    include: { createdBy: { select: { name: true } } },
  })

  await logActivity('UPDATED', 'GOAL', goal.id, session.user.id, session.user.name ?? 'Unknown')

  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const goal = await prisma.monthlyGoal.findUnique({ where: { id } })
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  if (!isUnitMember(session.user, goal.unitId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.monthlyGoal.update({ where: { id }, data: { deletedAt: new Date() } })

  await logActivity('DELETED', 'GOAL', goal.id, session.user.id, session.user.name ?? 'Unknown', { title: goal.title })

  return NextResponse.json({ success: true })
}

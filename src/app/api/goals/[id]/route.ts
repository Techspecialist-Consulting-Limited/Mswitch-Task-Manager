export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const goal = await prisma.monthlyGoal.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } }, weeklyGoals: { include: { _count: { select: { weeklyUpdates: true } } }, orderBy: { weekNumber: 'asc' } } },
  })
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  if (session.user.role === 'STAFF' && goal.userId !== session.user.id) {
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

  const isAdmin = session.user.role === 'SUPER_ADMIN'
  const isLeadOfUnit = session.user.role === 'UNIT_LEAD' && goal.unitId === session.user.unitId
  const isOwner = goal.userId === session.user.id
  if (!isAdmin && !isLeadOfUnit && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, month, status } = await request.json()
  const updated = await prisma.monthlyGoal.update({
    where: { id },
    data: { ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(month !== undefined && { month }), ...(status !== undefined && { status }) },
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const goal = await prisma.monthlyGoal.findUnique({ where: { id } })
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  const isAdmin = session.user.role === 'SUPER_ADMIN'
  const isOwner = goal.userId === session.user.id
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.monthlyGoal.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ success: true })
}

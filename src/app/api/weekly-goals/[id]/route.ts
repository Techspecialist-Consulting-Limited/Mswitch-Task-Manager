import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const wg = await prisma.weeklyGoal.findUnique({ where: { id }, include: { monthlyGoal: { select: { userId: true, unitId: true } } } })
  if (!wg) return NextResponse.json({ error: 'Weekly goal not found' }, { status: 404 })

  const { role, id: userId, unitId } = session.user
  const canEdit = role === 'SUPER_ADMIN' || wg.monthlyGoal.userId === userId || (role === 'UNIT_LEAD' && wg.monthlyGoal.unitId === unitId)
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const wg = await prisma.weeklyGoal.findUnique({ where: { id }, include: { monthlyGoal: { select: { userId: true, unitId: true } } } })
  if (!wg) return NextResponse.json({ error: 'Weekly goal not found' }, { status: 404 })

  const { role, id: userId, unitId } = session.user
  const canDelete = role === 'SUPER_ADMIN' || wg.monthlyGoal.userId === userId || (role === 'UNIT_LEAD' && wg.monthlyGoal.unitId === unitId)
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.weeklyGoal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

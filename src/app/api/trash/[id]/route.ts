export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { type } = await request.json()

  if (type !== 'goal' && type !== 'task') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const isAdmin = session.user.role === 'SUPER_ADMIN'

  if (type === 'goal') {
    const goal = await prisma.monthlyGoal.findUnique({ where: { id } })
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    if (!isAdmin && goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await prisma.monthlyGoal.update({ where: { id }, data: { deletedAt: null } })
    return NextResponse.json({ success: true })
  }

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (!isAdmin && task.assignedToId !== session.user.id && task.assignedById !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await prisma.task.update({ where: { id }, data: { deletedAt: null } })
  return NextResponse.json({ success: true })
}

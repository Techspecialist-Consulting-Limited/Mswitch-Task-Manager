export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAssignTasks } from '@/lib/permissions'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId, unitId } = session.user
  const where: Record<string, unknown> = { deletedAt: null }
  if (role === 'STAFF') where.assignedToId = userId
  else if (role === 'UNIT_LEAD' && unitId) {
    const members = await prisma.user.findMany({ where: { unitId }, select: { id: true } })
    where.assignedToId = { in: members.map(m => m.id) }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { assignedTo: { select: { id: true, name: true } }, assignedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canAssignTasks(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, assignedToId, deadline, recurrence } = await request.json()
  if (!title || !assignedToId) return NextResponse.json({ error: 'Title and assignee are required' }, { status: 400 })

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      assignedToId,
      assignedById: session.user.id,
      deadline: deadline ? new Date(deadline) : null,
      recurrence: recurrence || null,
    },
    include: { assignedTo: { select: { id: true, name: true } }, assignedBy: { select: { name: true } } },
  })
  return NextResponse.json(task)
}

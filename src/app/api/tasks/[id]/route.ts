export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAssignTasks } from '@/lib/permissions'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const task = await prisma.task.findUnique({
    where: { id },
    include: { assignedTo: { select: { id: true, name: true, email: true } }, assignedBy: { select: { id: true, name: true } } },
  })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const { role, id: userId } = session.user
  if (role === 'STAFF' && task.assignedToId !== userId && task.assignedById !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json(task)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const { role, id: userId } = session.user
  const canModify = role === 'SUPER_ADMIN' || canAssignTasks(role) || task.assignedToId === userId
  if (!canModify) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, status, deadline, assignedToId, recurrence } = await request.json()
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(recurrence !== undefined && { recurrence: recurrence || null }),
    },
    include: { assignedTo: { select: { id: true, name: true } }, assignedBy: { select: { name: true } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const { role, id: userId } = session.user
  if (role !== 'SUPER_ADMIN' && task.assignedById !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ success: true })
}

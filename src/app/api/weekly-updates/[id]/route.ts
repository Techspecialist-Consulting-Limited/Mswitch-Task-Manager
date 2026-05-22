import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const update = await prisma.weeklyUpdate.findUnique({ where: { id } })
  if (!update) return NextResponse.json({ error: 'Update not found' }, { status: 404 })

  const { role, id: userId } = session.user
  if (role !== 'SUPER_ADMIN' && update.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { updateText, progressPercentage, blockers } = await request.json()
  const updated = await prisma.weeklyUpdate.update({
    where: { id },
    data: {
      ...(updateText !== undefined && { updateText }),
      ...(progressPercentage !== undefined && { progressPercentage: Math.min(100, Math.max(0, progressPercentage)) }),
      ...(blockers !== undefined && { blockers }),
    },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const update = await prisma.weeklyUpdate.findUnique({ where: { id } })
  if (!update) return NextResponse.json({ error: 'Update not found' }, { status: 404 })

  const { role, id: userId } = session.user
  if (role !== 'SUPER_ADMIN' && update.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.weeklyUpdate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { type } = await request.json()

  if (type !== 'goal' && type !== 'task') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  if (type === 'goal') {
    await prisma.monthlyGoal.delete({ where: { id } })
  } else {
    await prisma.task.delete({ where: { id } })
  }

  return NextResponse.json({ success: true })
}

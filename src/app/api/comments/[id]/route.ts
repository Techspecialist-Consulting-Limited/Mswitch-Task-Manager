import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  const isOwner = comment.userId === session.user.id
  const isAdmin = session.user.role === 'SUPER_ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.comment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  if (comment.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { text } = await request.json()
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  const updated = await prisma.comment.update({
    where: { id },
    data: { text },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(updated)
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const key = await prisma.apiKey.findUnique({ where: { id } })
  if (!key) return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  if (key.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { active } = await request.json()
  const updated = await prisma.apiKey.update({
    where: { id },
    data: { active },
    select: { id: true, name: true, active: true, lastUsed: true, createdAt: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const key = await prisma.apiKey.findUnique({ where: { id } })
  if (!key) return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  if (key.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.apiKey.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const targetType = searchParams.get('targetType')
  const targetId = searchParams.get('targetId')

  if (!targetType || !targetId) {
    return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 })
  }

  const comments = await prisma.comment.findMany({
    where: { targetType, targetId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(comments)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, targetType, targetId } = await request.json()
  if (!text || !targetType || !targetId) {
    return NextResponse.json({ error: 'text, targetType, and targetId are required' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      text,
      targetType,
      targetId,
      userId: session.user.id,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(comment)
}

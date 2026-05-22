import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

  const where: Record<string, unknown> = { userId: session.user.id }
  if (unreadOnly) where.read = false

  const [notifications, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    prisma.notification.count({ where }),
  ])

  return NextResponse.json({
    notifications,
    unreadCount,
    totalPages: Math.ceil(total / PAGE_SIZE),
    currentPage: page,
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, title, message, type, link } = await request.json()
  if (!userId || !title) {
    return NextResponse.json({ error: 'userId and title are required' }, { status: 400 })
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message: message || '',
      type: type || 'INFO',
      link: link || null,
    },
  })

  return NextResponse.json(notification)
}

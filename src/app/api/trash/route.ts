export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ITEMS_PER_PAGE = 20

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  const isAdmin = session.user.role === 'SUPER_ADMIN'
  const userId = session.user.id

  const goalWhere: Record<string, unknown> = { deletedAt: { not: null } }
  const taskWhere: Record<string, unknown> = { deletedAt: { not: null } }

  if (!isAdmin) {
    goalWhere.userId = userId
    taskWhere.assignedToId = userId
  }

  const fetchGoals = type === 'all' || type === 'goal'
  const fetchTasks = type === 'all' || type === 'task'

  const goalQuery = fetchGoals
    ? prisma.monthlyGoal.findMany({
        where: goalWhere,
        select: { id: true, title: true, deletedAt: true },
        orderBy: { deletedAt: 'desc' },
      })
    : Promise.resolve([] as { id: string; title: string; deletedAt: Date | null }[])

  const taskQuery = fetchTasks
    ? prisma.task.findMany({
        where: taskWhere,
        select: { id: true, title: true, deletedAt: true },
        orderBy: { deletedAt: 'desc' },
      })
    : Promise.resolve([] as { id: string; title: string; deletedAt: Date | null }[])

  const [goals, tasks] = await Promise.all([goalQuery, taskQuery])

  const items = [
    ...goals.map(g => ({
      id: g.id,
      title: g.title,
      type: 'goal' as const,
      deletedAt: g.deletedAt?.toISOString() || '',
      originalUrl: `/goals/${g.id}`,
    })),
    ...tasks.map(t => ({
      id: t.id,
      title: t.title,
      type: 'task' as const,
      deletedAt: t.deletedAt?.toISOString() || '',
      originalUrl: `/tasks/${t.id}`,
    })),
  ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())

  const totalItems = items.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return NextResponse.json({
    items: paginatedItems,
    page,
    totalPages,
    totalItems,
  })
}

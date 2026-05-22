import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId, unitId } = session.user
  const isAdmin = role === 'SUPER_ADMIN'
  const isLead = role === 'UNIT_LEAD'

  const goalWhere: Record<string, unknown> = { deletedAt: null }
  if (!isAdmin) {
    if (isLead && unitId) goalWhere.unitId = unitId
    else goalWhere.userId = userId
  }
  const taskWhere: Record<string, unknown> = { deletedAt: null }
  if (!isAdmin) {
    if (isLead && unitId) taskWhere.assignedTo = { unitId }
    else taskWhere.assignedToId = userId
  }
  const updateWhere = isAdmin ? {} : { userId }

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const goals = await prisma.monthlyGoal.findMany({
    where: { ...goalWhere, createdAt: { gte: sixMonthsAgo } },
    select: { month: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const goalsByMonthMap: Record<string, number> = {}
  for (const g of goals) {
    const key = g.month
    goalsByMonthMap[key] = (goalsByMonthMap[key] || 0) + 1
  }
  const goalsByMonth = Object.entries(goalsByMonthMap).map(([month, count]) => ({ month, count }))

  const tasksByStatus = await prisma.task.groupBy({
    by: ['status'],
    where: taskWhere,
    _count: true,
  })

  const weeklyUpdates = await prisma.weeklyUpdate.findMany({
    where: updateWhere,
    select: { progressPercentage: true, weeklyGoal: { select: { weekNumber: true } }, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const weekMap: Record<number, { total: number; count: number }> = {}
  for (const u of weeklyUpdates) {
    const wn = u.weeklyGoal.weekNumber
    if (!weekMap[wn]) weekMap[wn] = { total: 0, count: 0 }
    weekMap[wn].total += u.progressPercentage
    weekMap[wn].count += 1
  }
  const weeklyProgress = Object.entries(weekMap)
    .map(([week, data]) => ({ week: Number(week), avgProgress: Math.round(data.total / data.count) }))
    .sort((a, b) => a.week - b.week)

  const [totalUsers, totalTasks, totalGoals, totalUnits] = await Promise.all([
    prisma.user.count(),
    prisma.task.count({ where: taskWhere }),
    prisma.monthlyGoal.count({ where: goalWhere }),
    prisma.unit.count(),
  ])

  return NextResponse.json({
    goalsByMonth,
    tasksByStatus: tasksByStatus.map(t => ({ status: t.status, count: t._count })),
    weeklyProgress,
    totals: { totalUsers, totalTasks, totalGoals, totalUnits },
  })
}

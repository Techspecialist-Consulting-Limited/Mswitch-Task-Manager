import { prisma } from '@/lib/prisma'

interface StatsUser {
  id: string
  role: string
  unitId?: string | null
}

export async function getDashboardStats(user: StatsUser) {
  const { role, id: userId, unitId } = user
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
  for (const goal of goals) {
    goalsByMonthMap[goal.month] = (goalsByMonthMap[goal.month] || 0) + 1
  }

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
  for (const update of weeklyUpdates) {
    const weekNumber = update.weeklyGoal.weekNumber
    if (!weekMap[weekNumber]) weekMap[weekNumber] = { total: 0, count: 0 }
    weekMap[weekNumber].total += update.progressPercentage
    weekMap[weekNumber].count += 1
  }

  const [totalUsers, totalTasks, totalGoals, totalUnits] = await Promise.all([
    prisma.user.count(),
    prisma.task.count({ where: taskWhere }),
    prisma.monthlyGoal.count({ where: goalWhere }),
    prisma.unit.count(),
  ])

  return {
    goalsByMonth: Object.entries(goalsByMonthMap).map(([month, count]) => ({ month, count })),
    tasksByStatus: tasksByStatus.map((task) => ({ status: task.status, count: task._count })),
    weeklyProgress: Object.entries(weekMap)
      .map(([week, data]) => ({ week: Number(week), avgProgress: Math.round(data.total / data.count) }))
      .sort((a, b) => a.week - b.week),
    totals: { totalUsers, totalTasks, totalGoals, totalUnits },
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const goal = await prisma.monthlyGoal.findUnique({
    where: { id },
    include: {
      weeklyGoals: {
        include: { weeklyUpdates: { select: { progressPercentage: true } } },
        orderBy: { weekNumber: 'asc' },
      },
    },
  })

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  if (session.user.role === 'STAFF' && goal.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allPercentages = goal.weeklyGoals.flatMap(wg => wg.weeklyUpdates.map(u => u.progressPercentage))
  const averageProgress = allPercentages.length > 0
    ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
    : 0

  const weeklyProgress = goal.weeklyGoals.map(wg => {
    const percentages = wg.weeklyUpdates.map(u => u.progressPercentage)
    const avg = percentages.length > 0
      ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
      : 0
    return { weekNumber: wg.weekNumber, progress: avg }
  })

  return NextResponse.json({ goalId: id, averageProgress, weeklyProgress })
}

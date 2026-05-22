import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/calendar/calendar-view'

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { role, id: userId, unitId } = session.user

  const whereGoals = role === 'STAFF' ? { userId } : role === 'UNIT_LEAD' && unitId ? { unitId } : {}
  const whereTasks = role === 'STAFF' ? { assignedToId: userId } : role === 'UNIT_LEAD' && unitId
    ? { assignedTo: { unitId } }
    : {}

  const goals = await prisma.monthlyGoal.findMany({
    where: whereGoals,
    select: { id: true, title: true, month: true, status: true },
    orderBy: { month: 'desc' },
  })

  const tasksRaw = await prisma.task.findMany({
    where: whereTasks,
    select: { id: true, title: true, deadline: true, status: true, assignedTo: { select: { name: true } } },
    orderBy: { deadline: 'asc' },
  })

  const tasks = tasksRaw.map(t => ({
    ...t,
    deadline: t.deadline ? t.deadline.toISOString() : null,
  }))

  return <CalendarView goals={goals} tasks={tasks} />
}

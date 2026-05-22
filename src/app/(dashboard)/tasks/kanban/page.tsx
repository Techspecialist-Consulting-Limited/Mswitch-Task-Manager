import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { KanbanBoard } from '@/components/tasks/kanban-board'

export default async function KanbanPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { role, id: userId, unitId } = session.user
  const where: Record<string, unknown> = {}
  if (role === 'STAFF') where.assignedToId = userId
  else if (role === 'UNIT_LEAD' && unitId) {
    const members = await prisma.user.findMany({ where: { unitId }, select: { id: true } })
    where.assignedToId = { in: members.map(m => m.id) }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { assignedTo: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <PageHeader title="Kanban Board" description="Drag and drop tasks to update status" />
      <KanbanBoard tasks={tasks} />
    </div>
  )
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId, unitId } = session.user
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = { deletedAt: null }
  if (role === 'STAFF') where.assignedToId = userId
  else if (role === 'UNIT_LEAD' && unitId) {
    const members = await prisma.user.findMany({ where: { unitId }, select: { id: true } })
    where.assignedToId = { in: members.map(m => m.id) }
  }
  if (status) where.status = status

  const tasks = await prisma.task.findMany({
    where,
    include: { assignedTo: { select: { name: true } }, assignedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const headers = 'Title,Description,Status,Assigned To,Assigned By,Deadline,Created At'
  const rows = tasks.map(t => {
    const title = t.title.replace(/"/g, '""')
    const desc = (t.description || '').replace(/"/g, '""')
    const deadline = t.deadline ? t.deadline.toISOString().split('T')[0] : ''
    return `"${title}","${desc}","${t.status}","${t.assignedTo.name}","${t.assignedBy.name}","${deadline}","${t.createdAt.toISOString()}"`
  })

  return new NextResponse([headers, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="tasks.csv"',
    },
  })
}

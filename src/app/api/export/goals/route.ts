import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, id: userId, unitId } = session.user
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const month = searchParams.get('month')

  const where: Record<string, unknown> = { deletedAt: null }
  if (role === 'STAFF') where.userId = userId
  else if (role === 'UNIT_LEAD' && unitId) where.unitId = unitId
  if (status) where.status = status
  if (month) where.month = month

  const goals = await prisma.monthlyGoal.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const headers = 'Title,Description,Month,Status,Owner,Created At'
  const rows = goals.map(g => {
    const title = g.title.replace(/"/g, '""')
    const desc = (g.description || '').replace(/"/g, '""')
    return `"${title}","${desc}","${g.month}","${g.status}","${g.user.name}","${g.createdAt.toISOString()}"`
  })

  return new NextResponse([headers, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="goals.csv"',
    },
  })
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, unitId } = session.user
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const month = searchParams.get('month')

  const where: Record<string, unknown> = { deletedAt: null }
  if (role !== 'SUPER_ADMIN') {
    if (!unitId) return new NextResponse('Title,Description,Month,Status,Team,Created By,Contributors,Created At', { headers: { 'Content-Type': 'text/csv' } })
    where.unitId = unitId
  }
  if (status) where.status = status
  if (month) where.month = month

  const goals = await prisma.monthlyGoal.findMany({
    where,
    include: {
      unit: { select: { name: true } },
      createdBy: { select: { name: true } },
      weeklyGoals: { include: { weeklyUpdates: { select: { user: { select: { name: true } } } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = 'Title,Description,Month,Status,Team,Created By,Contributors,Created At'
  const rows = goals.map(g => {
    const title = g.title.replace(/"/g, '""')
    const desc = (g.description || '').replace(/"/g, '""')
    const contributors = Array.from(new Set(g.weeklyGoals.flatMap(wg => wg.weeklyUpdates.map(u => u.user.name)))).join('; ').replace(/"/g, '""')
    return `"${title}","${desc}","${g.month}","${g.status}","${g.unit.name}","${g.createdBy.name}","${contributors}","${g.createdAt.toISOString()}"`
  })

  return new NextResponse([headers, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="goals.csv"',
    },
  })
}

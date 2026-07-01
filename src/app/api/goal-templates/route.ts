export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const where = session.user.role === 'SUPER_ADMIN'
    ? {}
    : { OR: [{ unitId: session.user.unitId }, { unitId: null }] }

  const templates = await prisma.goalTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(templates)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, weekTitles, unitId } = await request.json()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  // Non-admins can only save templates scoped to their own team; admins may set org-wide (null) or a specific team.
  const resolvedUnitId = session.user.role === 'SUPER_ADMIN' ? (unitId ?? null) : session.user.unitId

  const template = await prisma.goalTemplate.create({
    data: {
      title,
      description: description || null,
      weekTitles: weekTitles || null,
      unitId: resolvedUnitId,
    },
  })

  return NextResponse.json(template)
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canManageUnits } from '@/lib/permissions'

export async function GET() {
  const units = await prisma.unit.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(units)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUnits(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, description, leadId } = await request.json()
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const existing = await prisma.unit.findUnique({ where: { name: name.trim() } })
  if (existing) return NextResponse.json({ error: 'Unit with this name already exists' }, { status: 409 })

  if (leadId) {
    const leadUser = await prisma.user.findUnique({ where: { id: leadId } })
    if (!leadUser) return NextResponse.json({ error: 'Lead user not found' }, { status: 400 })
    if (leadUser.role !== 'UNIT_LEAD' && leadUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Lead must be a UNIT_LEAD or SUPER_ADMIN' }, { status: 400 })
    }
  }

  const unit = await prisma.unit.create({
    data: {
      name: name.trim(),
      description: description || null,
      leadId: leadId || null,
    },
    include: { lead: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json(unit)
}

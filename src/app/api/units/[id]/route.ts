export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canManageUnits } from '@/lib/permissions'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true, email: true, role: true } },
      members: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { monthlyGoals: true } },
    },
  })
  if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  return NextResponse.json(unit)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUnits(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const unit = await prisma.unit.findUnique({ where: { id } })
  if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })

  const { name, description, leadId } = await request.json()

  if (name !== undefined && typeof name === 'string') {
    const trimmed = name.trim()
    if (!trimmed) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    const existing = await prisma.unit.findFirst({ where: { name: trimmed, id: { not: id } } })
    if (existing) return NextResponse.json({ error: 'Unit with this name already exists' }, { status: 409 })
  }

  if (leadId !== undefined) {
    if (leadId === null) {
      await prisma.unit.update({ where: { id }, data: { leadId: null } })
      return NextResponse.json({ success: true })
    }
    const leadUser = await prisma.user.findUnique({ where: { id: leadId } })
    if (!leadUser) return NextResponse.json({ error: 'Lead user not found' }, { status: 400 })
    if (leadUser.unitId !== id) return NextResponse.json({ error: 'Lead must belong to this unit' }, { status: 400 })
    if (leadUser.role !== 'UNIT_LEAD' && leadUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Lead must be a UNIT_LEAD or SUPER_ADMIN' }, { status: 400 })
    }
  }

  const updated = await prisma.unit.update({
    where: { id },
    data: { ...(name !== undefined && { name: name.trim() }), ...(description !== undefined && { description: description || null }), ...(leadId !== undefined && { leadId }) },
    include: { lead: { select: { id: true, name: true, email: true } }, _count: { select: { members: true, monthlyGoals: true } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUnits(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: { _count: { select: { members: true, monthlyGoals: true } } },
  })
  if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })

  if (unit._count.members > 0) {
    return NextResponse.json({ error: 'Cannot delete unit with existing members. Reassign members first.' }, { status: 409 })
  }
  if (unit._count.monthlyGoals > 0) {
    return NextResponse.json({ error: 'Cannot delete unit with existing goals. Remove or reassign goals first.' }, { status: 409 })
  }

  await prisma.unit.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

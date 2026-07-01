export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canManageUsers } from '@/lib/permissions'
import { ROLES } from '@/lib/constants'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, unit: { select: { id: true, name: true } }, createdAt: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { role, isActive, unitId } = await request.json()
  const data: Record<string, unknown> = {}

  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    data.role = role
  }

  if (isActive !== undefined) {
    if (typeof isActive !== 'boolean') return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
    data.isActive = isActive
  }

  if (unitId !== undefined) {
    if (unitId !== null) {
      const unit = await prisma.unit.findUnique({ where: { id: unitId } })
      if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 400 })
    }
    data.unitId = unitId
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, unit: { select: { id: true, name: true } } },
  })
  return NextResponse.json(updated)
}

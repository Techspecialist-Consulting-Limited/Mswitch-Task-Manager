import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const template = await prisma.goalTemplate.findUnique({ where: { id } })
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  await prisma.goalTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { title, description, weekTitles, unitId } = await request.json()

  const template = await prisma.goalTemplate.findUnique({ where: { id } })
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const updated = await prisma.goalTemplate.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(weekTitles !== undefined && { weekTitles }),
      ...(unitId !== undefined && { unitId }),
    },
  })

  return NextResponse.json(updated)
}

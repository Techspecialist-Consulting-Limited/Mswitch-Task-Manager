import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId')

  const where = unitId ? { unitId } : {}

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

  const template = await prisma.goalTemplate.create({
    data: {
      title,
      description: description || null,
      weekTitles: weekTitles || null,
      unitId: unitId || null,
    },
  })

  return NextResponse.json(template)
}

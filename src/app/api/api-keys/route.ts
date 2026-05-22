import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import crypto, { createHash } from 'crypto'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, active: true, lastUsed: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(keys)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const rawKey = `tm_${Date.now().toString(36)}_${crypto.randomUUID()}`
  const hashedKey = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      key: hashedKey,
      userId: session.user.id,
    },
    select: { id: true, name: true, active: true, lastUsed: true, createdAt: true },
  })

  return NextResponse.json({ ...apiKey, key: rawKey })
}

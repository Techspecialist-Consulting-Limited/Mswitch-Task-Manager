export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(webhooks)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, url, events, secret } = await request.json()
  if (!name || !url || !events) {
    return NextResponse.json({ error: 'name, url, and events are required' }, { status: 400 })
  }

  const webhook = await prisma.webhook.create({
    data: { name, url, events, secret: secret || null },
  })

  return NextResponse.json(webhook)
}

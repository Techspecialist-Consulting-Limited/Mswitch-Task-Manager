export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await checkAdmin()
  if (err) return err

  const { id } = await params
  const webhook = await prisma.webhook.findUnique({ where: { id } })
  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })

  return NextResponse.json(webhook)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await checkAdmin()
  if (err) return err

  const { id } = await params
  const webhook = await prisma.webhook.findUnique({ where: { id } })
  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })

  const { name, url, events, active, secret } = await request.json()
  const updated = await prisma.webhook.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(url !== undefined && { url }),
      ...(events !== undefined && { events }),
      ...(active !== undefined && { active }),
      ...(secret !== undefined && { secret }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await checkAdmin()
  if (err) return err

  const { id } = await params
  const webhook = await prisma.webhook.findUnique({ where: { id } })
  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })

  await prisma.webhook.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

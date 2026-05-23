export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const attachment = await prisma.attachment.findUnique({ where: { id } })
  if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })

  const isOwner = attachment.uploadedById === session.user.id
  const isAdmin = session.user.role === 'SUPER_ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const filePath = join(process.cwd(), 'public', attachment.storagePath)
    await unlink(filePath)
  } catch { }

  await prisma.attachment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

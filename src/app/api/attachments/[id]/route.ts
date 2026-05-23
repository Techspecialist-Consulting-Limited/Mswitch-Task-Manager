export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { del } from '@vercel/blob'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const attachment = await prisma.attachment.findUnique({ where: { id } })
    if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })

    const isOwner = attachment.uploadedById === session.user.id
    const isAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await del(attachment.url)

    await prisma.attachment.delete({ where: { id } })

    console.log(`[ATTACHMENT] Deleted: ${attachment.fileName} (${attachment.url})`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Attachment DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}

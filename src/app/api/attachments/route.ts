export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'

const MAX_FILE_SIZE = 4 * 1024 * 1024

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/json',
]

function isAllowed(mime: string): boolean {
  return ALLOWED_TYPES.includes(mime) || mime.startsWith('image/')
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255)
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 })
    }

    const attachments = await prisma.attachment.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        url: a.url,
        pathname: a.pathname,
        uploadedById: a.uploadedById,
        createdAt: a.createdAt,
      }))
    )
  } catch (err) {
    console.error('Attachments GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[ATTACHMENT] BLOB_READ_WRITE_TOKEN is not set')
      return NextResponse.json({ error: 'File storage is not configured. Set BLOB_READ_WRITE_TOKEN.' }, { status: 500 })
    }

    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const targetType = formData.get('targetType') as string
    const targetId = formData.get('targetId') as string

    if (!file || !targetType || !targetId) {
      return NextResponse.json({ error: 'File, targetType, and targetId are required' }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 4MB limit' }, { status: 400 })
    }

    if (!isAllowed(file.type)) {
      return NextResponse.json({ error: `File type "${file.type}" is not allowed` }, { status: 400 })
    }

    const safeName = sanitizeFilename(file.name)
    const blobPathname = `attachments/${crypto.randomUUID()}-${safeName}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const blob = await put(blobPathname, buffer, {
      access: 'public',
      contentType: file.type,
    })

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url: blob.url,
        pathname: blob.pathname,
        targetType,
        targetId,
        uploadedById: session.user.id,
      },
    })

    console.log(`[ATTACHMENT] Uploaded: ${file.name} (${file.size} bytes, ${file.type}) → ${blob.url}`)

    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      url: attachment.url,
      pathname: attachment.pathname,
      uploadedById: attachment.uploadedById,
      createdAt: attachment.createdAt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ATTACHMENT] POST error:', err)
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 })
  }
}

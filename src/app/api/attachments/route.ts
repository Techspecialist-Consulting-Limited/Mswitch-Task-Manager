import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function GET(request: Request) {
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  return NextResponse.json(attachments.map(a => ({
    ...a,
    url: a.storagePath ? `${baseUrl}${a.storagePath}` : null,
  })))
}

export async function POST(request: Request) {
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

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || ''
  const uniqueName = `${randomUUID()}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  const filePath = join(uploadDir, uniqueName)
  const storagePath = `/uploads/${uniqueName}`

  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const attachment = await prisma.attachment.create({
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      storagePath,
      targetType,
      targetId,
      uploadedById: session.user.id,
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  return NextResponse.json({ ...attachment, url: `${baseUrl}${storagePath}` })
}

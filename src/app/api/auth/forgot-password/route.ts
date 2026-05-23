export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    const resetToken = crypto.randomUUID()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    })

    const origin = new URL(request.url).origin
    console.log(`[DEV] Password reset link for ${email}: ${origin}/reset-password?token=${resetToken}`)
  }

  return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
}

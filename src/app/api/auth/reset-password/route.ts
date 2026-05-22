import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { token, password } = await request.json()
  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  })

  return NextResponse.json({ message: 'Password reset successfully' })
}

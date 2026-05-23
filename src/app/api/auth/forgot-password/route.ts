export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashToken(rawToken)
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: tokenHash, resetTokenExpiry },
      })

      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
      const resetLink = `${appUrl}/reset-password?token=${rawToken}`

      const emailHtml = `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#18181b;">Reset your password</h2>
          <p style="color:#52525b;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display:inline-block;background-color:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Reset password</a>
          <p style="color:#a1a1aa;font-size:12px;margin-top:24px;">If you didn't request this, you can ignore this email.</p>
        </div>
      `

      await sendEmail(email, 'Reset your TaskFlow password', emailHtml)

      console.log(`[FORGOT] Reset link sent to ${email} (user: ${user.id})`)
    } else {
      console.log(`[FORGOT] No account found for ${email} — returning generic response`)
    }

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 })
  }
}

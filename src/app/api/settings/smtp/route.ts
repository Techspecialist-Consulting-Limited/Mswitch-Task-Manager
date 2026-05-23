export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  })
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value

  if (!map.smtp_host || !map.smtp_port) {
    return NextResponse.json({ error: 'SMTP not configured. Set host and port first.' }, { status: 400 })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: map.smtp_host,
      port: parseInt(map.smtp_port, 10),
      secure: parseInt(map.smtp_port, 10) === 465,
      auth: map.smtp_user && map.smtp_pass
        ? { user: map.smtp_user, pass: map.smtp_pass }
        : undefined,
    })

    await transporter.sendMail({
      from: map.smtp_from || map.smtp_user || 'noreply@example.com',
      to: session.user.email!,
      subject: 'SMTP Test from TaskFlow',
      html: '<p>This is a test email to verify your SMTP configuration.</p><p>If you received this, your SMTP settings are working correctly.</p>',
    })

    return NextResponse.json({ success: true, message: 'Test email sent successfully' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to send test email' }, { status: 500 })
  }
}

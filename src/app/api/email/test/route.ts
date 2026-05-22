import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { to, subject, message } = await request.json()
  if (!to || !subject || !message) {
    return NextResponse.json({ error: 'to, subject, and message are required' }, { status: 400 })
  }

  await sendEmail(to, subject, message)
  return NextResponse.json({ success: true })
}

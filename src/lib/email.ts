import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { prisma } from './prisma'

const APP_NAME = 'TaskFlow'

async function getSmtpSettings() {
  const envHost = process.env.SMTP_HOST
  if (envHost) {
    return {
      smtp_host: envHost,
      smtp_port: process.env.SMTP_PORT || '587',
      smtp_user: process.env.SMTP_USER || '',
      smtp_pass: process.env.SMTP_PASS || '',
      smtp_from: process.env.SMTP_FROM || '',
    }
  }

  const keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  })
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return map
}

const DEFAULT_FROM = process.env.SMTP_FROM || `${APP_NAME} <noreply@${new URL(process.env.APP_URL || 'http://localhost:3000').hostname}>`

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey)
      const from = DEFAULT_FROM
      await resend.emails.send({ from, to: [to], subject, html })
      console.log(`[EMAIL] Sent via Resend to ${to} — subject: ${subject}`)
      return
    } catch (error) {
      console.error('[EMAIL] Resend failed, falling back to SMTP:', error)
    }
  }

  try {
    const smtp = await getSmtpSettings()
    if (smtp.smtp_host && smtp.smtp_port) {
      const transporter = nodemailer.createTransport({
        host: smtp.smtp_host,
        port: parseInt(smtp.smtp_port, 10),
        secure: parseInt(smtp.smtp_port, 10) === 465,
        auth: smtp.smtp_user && smtp.smtp_pass
          ? { user: smtp.smtp_user, pass: smtp.smtp_pass }
          : undefined,
      })
      await transporter.sendMail({
        from: smtp.smtp_from || DEFAULT_FROM,
        to,
        subject,
        html,
      })
      console.log(`[EMAIL] Sent via SMTP to ${to} — subject: ${subject}`)
      return
    }
  } catch (error) {
    console.error('[EMAIL] SMTP failed:', error)
  }

  console.warn(`[EMAIL] No email provider configured. To send real emails, set RESEND_API_KEY or SMTP_HOST/SMTP_PORT in env.`)
  console.log(`[EMAIL] Would have sent to: ${to}, Subject: ${subject}`)
}

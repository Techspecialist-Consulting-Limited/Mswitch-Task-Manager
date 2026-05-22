import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { prisma } from './prisma'

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

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey)
      const from = process.env.SMTP_FROM || 'TaskFlow <noreply@taskflow.app>'
      await resend.emails.send({ from, to: [to], subject, html })
      return
    } catch (error) {
      console.error('[EMAIL] Resend failed, falling back:', error)
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
        from: smtp.smtp_from || smtp.smtp_user || 'noreply@example.com',
        to,
        subject,
        html,
      })
      return
    }
  } catch (error) {
    console.error('[EMAIL] SMTP failed:', error)
  }

  console.log(`[EMAIL] No email provider configured. To: ${to}, Subject: ${subject}\n${html}`)
}

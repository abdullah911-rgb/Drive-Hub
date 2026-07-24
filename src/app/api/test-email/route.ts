import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

/**
 * GET /api/test-email?to=someone@example.com
 * Admin-only. Tests the SMTP config by sending a real email.
 */
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') || currentUser.email

  const config = {
    SMTP_HOST: process.env.SMTP_HOST ? 'set' : '(not set)',
    SMTP_PORT: process.env.SMTP_PORT || '(not set, default 587)',
    SMTP_USER: process.env.SMTP_USER ? 'set' : '(NOT SET)',
    SMTP_PASS: process.env.SMTP_PASS ? '***set***' : '(NOT SET)',
    SMTP_FROM: process.env.SMTP_FROM ? 'set' : '(not set, will use default)',
    sending_to: to,
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({
      success: false,
      error: 'SMTP_USER or SMTP_PASS is missing. Set them in .env / Vercel env vars, then restart/redeploy.',
      config,
    }, { status: 500 })
  }

  const emailSent = await sendEmail({
    to,
    subject: `NextTripy SMTP Test — ${new Date().toISOString()}`,
    title: 'SMTP is Working!',
    bodyHtml: `This test email was sent successfully from your NextTripy app.<br><br>Sent at: <strong>${new Date().toISOString()}</strong>`,
    ctaLabel: 'Open App',
    ctaUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  })

  if (!emailSent) {
    return NextResponse.json({
      success: false,
      error: 'SMTP send failed — check server logs for [Email] errors',
      config,
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `Test email sent to ${to}`,
    config,
  })
}

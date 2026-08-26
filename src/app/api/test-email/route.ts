import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendEmailDetailed } from '@/lib/email'

/**
 * GET /api/test-email?to=someone@example.com&secret=...
 * Admin-only (or with ?secret=<JWT_SECRET>). Tests the SMTP config by sending a real email.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const currentUser = await getCurrentUser()

  const isAuthorized =
    (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) ||
    (secret && process.env.JWT_SECRET && secret === process.env.JWT_SECRET)

  if (!isAuthorized) {
    return NextResponse.json(
      {
        error: 'Unauthorized. Log in as an Admin or provide ?secret=<JWT_SECRET> to test SMTP.',
      },
      { status: 401 }
    )
  }

  const to = searchParams.get('to') || currentUser?.email || process.env.SMTP_USER || 'info@nexttripy.com'

  const config = {
    SMTP_HOST: process.env.SMTP_HOST || 'mail.nexttripy.com (default)',
    SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
    SMTP_USER: process.env.SMTP_USER || '(NOT SET)',
    SMTP_PASS_SET: !!process.env.SMTP_PASS,
    SMTP_PASS_LENGTH: process.env.SMTP_PASS?.length || 0,
    SMTP_FROM: process.env.SMTP_FROM || '(default will be used)',
    sending_to: to,
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json(
      {
        success: false,
        error: 'SMTP_USER or SMTP_PASS is missing in environment variables. Add them in Vercel / .env.local and redeploy.',
        config,
      },
      { status: 500 }
    )
  }

  const result = await sendEmailDetailed({
    to,
    subject: `NextTripy SMTP Test — ${new Date().toISOString()}`,
    title: 'SMTP is Working!',
    bodyHtml: `This test email was sent successfully from your NextTripy application.<br><br>Sent at: <strong>${new Date().toISOString()}</strong>`,
    ctaLabel: 'Open App',
    ctaUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  })

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        attempts: result.attempts,
        config,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Test email successfully delivered to ${to}`,
    messageId: result.messageId,
    attempts: result.attempts,
    config,
  })
}

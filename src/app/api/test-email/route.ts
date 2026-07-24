import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/test-email
 * Admin-only endpoint to verify SMTP configuration is working.
 * Visit this URL while logged in as admin to trigger a test email.
 */
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') || currentUser.email

  try {
    await sendEmail({
      to,
      subject: '✅ NextTripy SMTP Test',
      title: 'SMTP Test Successful',
      bodyHtml: `<p>This is a test email sent from your NextTripy app at <strong>${new Date().toISOString()}</strong>.</p><p>If you received this, your SMTP configuration is working correctly! 🎉</p>`,
    })
    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`,
      config: {
        SMTP_HOST: process.env.SMTP_HOST?.replace(/^["']|["']$/g, '') || '(not set)',
        SMTP_PORT: process.env.SMTP_PORT?.replace(/^["']|["']$/g, '') || '(not set)',
        SMTP_USER: process.env.SMTP_USER?.replace(/^["']|["']$/g, '') || '(not set)',
        SMTP_FROM: process.env.SMTP_FROM?.replace(/^["']|["']$/g, '') || '(not set)',
        SMTP_PASS: process.env.SMTP_PASS ? '***set***' : '(not set)',
      },
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      config: {
        SMTP_HOST: process.env.SMTP_HOST?.replace(/^["']|["']$/g, '') || '(not set)',
        SMTP_PORT: process.env.SMTP_PORT?.replace(/^["']|["']$/g, '') || '(not set)',
        SMTP_USER: process.env.SMTP_USER?.replace(/^["']|["']$/g, '') || '(not set)',
        SMTP_FROM: process.env.SMTP_FROM?.replace(/^["']|["']$/g, '') || '(not set)',
        SMTP_PASS: process.env.SMTP_PASS ? '***set***' : '(not set)',
      },
    }, { status: 500 })
  }
}

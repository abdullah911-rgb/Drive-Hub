import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

function cleanEnv(val: string | undefined): string | undefined {
  if (!val) return val
  return val.replace(/^["']|["']$/g, '').trim()
}

/**
 * GET /api/test-email?to=someone@example.com
 * Admin-only. Tests the SMTP config by sending a real email.
 * Shows exactly what env vars Vercel is reading.
 */
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') || currentUser.email

  const smtpHost = cleanEnv(process.env.SMTP_HOST) || '(not set)'
  const smtpPort = cleanEnv(process.env.SMTP_PORT) || '(not set)'
  const smtpUser = cleanEnv(process.env.SMTP_USER)
  const smtpPass = cleanEnv(process.env.SMTP_PASS)
  const smtpFrom = cleanEnv(process.env.SMTP_FROM)

  // Show env var status first
  const config = {
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_USER: smtpUser || '(NOT SET — this is why emails fail!)',
    SMTP_PASS: smtpPass ? '***set***' : '(NOT SET — this is why emails fail!)',
    SMTP_FROM: smtpFrom || '(not set, will use default)',
    sending_to: to,
  }

  if (!smtpUser || !smtpPass) {
    return NextResponse.json({
      success: false,
      error: 'SMTP_USER or SMTP_PASS is missing from Vercel environment variables. Set them in Vercel → Project → Settings → Environment Variables, then redeploy.',
      config,
    }, { status: 500 })
  }

  try {
    // Import nodemailer here to avoid edge runtime issues
    const nodemailer = await import('nodemailer')
    const port = parseInt(smtpPort || '587', 10)
    const secure = port === 465

    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port,
      secure,
      requireTLS: !secure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    })

    const fromAddress = smtpFrom || `NextTripy <${smtpUser}>`

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `✅ NextTripy SMTP Test — ${new Date().toISOString()}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px;background:#1e293b;color:#f1f5f9;border-radius:12px;">
          <h1 style="color:#34d399;">✅ SMTP is Working!</h1>
          <p>This test email was sent successfully from your NextTripy app.</p>
          <p>Sent at: <strong>${new Date().toISOString()}</strong></p>
          <p>From: <strong>${fromAddress}</strong></p>
          <p>To: <strong>${to}</strong></p>
          <hr style="border-color:#334155;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;">This means company approval/rejection emails will also work correctly.</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`,
      messageId: info.messageId,
      response: info.response,
      config,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; response?: string; message?: string }
    return NextResponse.json({
      success: false,
      error: e?.message || String(err),
      code: e?.code,
      smtpResponse: e?.response,
      config,
    }, { status: 500 })
  }
}

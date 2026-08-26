import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 })
    }

    const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Inbox notification must succeed — previously failures were ignored
    const inboxOk = await sendEmail({
      to: 'info@nexttripy.com',
      subject: `[Contact Form] ${subject}`,
      title: `New message from ${name}`,
      bodyHtml: `
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:16px 0;" />
        <p style="white-space:pre-wrap;">${safeMessage}</p>
      `,
    })

    if (!inboxOk) {
      return NextResponse.json(
        { success: false, error: 'Email service is unavailable. Please try again or email info@nexttripy.com directly.' },
        { status: 503 }
      )
    }

    // Confirmation to sender is best-effort (don't fail the request if it bounces)
    await sendEmail({
      to: email,
      subject: 'We received your message — NextTripy',
      title: `Hi ${name}, we got your message!`,
      bodyHtml: `
        <p>Thank you for reaching out. We've received your message and will get back to you as soon as possible.</p>
        <p style="margin-top:16px;"><strong>Your message:</strong></p>
        <p style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;white-space:pre-wrap;">${safeMessage}</p>
        <p style="margin-top:16px;color:#94a3b8;font-size:13px;">If you have any urgent questions, you can also reach us at <a href="mailto:info@nexttripy.com" style="color:#6366f1;">info@nexttripy.com</a></p>
      `,
      ctaLabel: 'Visit NextTripy',
      ctaUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://nexttripy.com',
    })

    return NextResponse.json({ success: true, data: { message: 'Message sent successfully' } })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}

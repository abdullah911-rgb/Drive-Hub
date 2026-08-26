import nodemailer from 'nodemailer'
import { prisma } from './prisma'

/** Strip surrounding quotes that appear when .env values are copy-pasted into Vercel's dashboard */
function cleanEnv(val: string | undefined): string | undefined {
  if (!val) return val
  let v = val.trim()
  // Peel nested/wrapping quotes from dashboard paste (e.g. "\"NextTripy\" <a@b.com>")
  for (let i = 0; i < 3; i++) {
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1).trim()
      continue
    }
    break
  }
  return v.replace(/\\"/g, '"').replace(/\\'/g, "'").trim()
}

/** Build a valid RFC From header; malformed SMTP_FROM often becomes "Name  user"@domain */
function normalizeFromAddress(rawFrom: string | undefined, smtpUser: string): string {
  const fallback = `"NextTripy" <${smtpUser}>`
  if (!rawFrom) return fallback

  const v = cleanEnv(rawFrom) || ''
  const angle = v.match(/<([^>]+)>/)
  if (angle) {
    const email = angle[1].trim().replace(/^["']|["']$/g, '')
    const name = v.replace(/<[^>]+>/, '').trim().replace(/^["']|["']$/g, '').replace(/"/g, '').trim()
    if (email.includes('@')) {
      return name ? `"${name}" <${email}>` : email
    }
  }

  // Bare email
  if (/^[^\s<>]+@[^\s<>]+$/.test(v)) return v

  console.warn('[Email] Invalid SMTP_FROM — falling back to SMTP_USER. Got:', rawFrom)
  return fallback
}

function createTransporter(options?: { port?: number; secure?: boolean; requireTLS?: boolean }) {
  const host = cleanEnv(process.env.SMTP_HOST) || 'mail.nexttripy.com'
  const rawPort = cleanEnv(process.env.SMTP_PORT)
  const port = options?.port ?? parseInt(rawPort || '587', 10)
  const user = cleanEnv(process.env.SMTP_USER)
  const pass = cleanEnv(process.env.SMTP_PASS)

  const secure = options?.secure ?? (port === 465)
  const requireTLS = options?.requireTLS ?? (!secure)
  console.log(`[Email] Transporter → host=${host} port=${port} secure=${secure} requireTLS=${requireTLS} user=${user} passLen=${pass?.length ?? 0}`)

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false, // cPanel/shared-host self-signed certs
      minVersion: 'TLSv1.2',
    },
    // Force IPv4 to prevent IPv6 timeouts on serverless (AWS Lambda / Vercel)
    family: 4,
    pool: false,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
  } as nodemailer.TransportOptions)
}

function buildHtml(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Logo Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:28px 40px;border-radius:16px 16px 0 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="display:inline-table;">
              <tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <div style="width:40px;height:40px;background:rgba(255,255,255,0.25);border-radius:10px;text-align:center;line-height:40px;font-size:20px;font-weight:900;color:#fff;display:inline-block;">N</div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">NextTripy</span>
                </td>
              </tr>
            </table>
            <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:8px 0 0;letter-spacing:1px;text-transform:uppercase;">Notification Center</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#1e293b;padding:40px;border-radius:0 0 16px 16px;">
            <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 16px;line-height:1.3;">${title}</h1>
            <div style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 32px;">${bodyHtml}</div>

            ${ctaLabel && ctaUrl ? `
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);">
                  <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;">${ctaLabel}</a>
                </td>
              </tr>
            </table>` : ''}

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;">
              <tr><td style="border-top:1px solid rgba(255,255,255,0.07);padding-top:24px;">
                <p style="color:#475569;font-size:12px;margin:0;">NextTripy &bull; Car Rentals & Hotel Rooms</p>
                <p style="color:#334155;font-size:11px;margin:6px 0 0;">This is an automated message, please do not reply directly. For support: <a href="mailto:info@nexttripy.com" style="color:#6366f1;">info@nexttripy.com</a></p>
                <p style="color:#1e293b;font-size:11px;margin:6px 0 0;"><a href="${appUrl}" style="color:#334155;">${appUrl}</a></p>
              </td></tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
  attempts?: Array<{ port: number; secure: boolean; error?: string; ok: boolean }>
}

export async function sendEmailDetailed(opts: {
  to: string
  subject: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}): Promise<SendEmailResult> {
  const smtpUser = cleanEnv(process.env.SMTP_USER)
  const smtpPass = cleanEnv(process.env.SMTP_PASS)

  if (!smtpUser || !smtpPass) {
    const msg = 'SMTP_USER or SMTP_PASS is missing in environment variables'
    console.warn(`[Email] ${msg} — skipping email to`, opts.to)
    return { success: false, error: msg }
  }

  const rawPort = parseInt(cleanEnv(process.env.SMTP_PORT) || '587', 10)
  const fromAddress = normalizeFromAddress(process.env.SMTP_FROM, smtpUser)
  const html = buildHtml(opts.title, opts.bodyHtml, opts.ctaLabel, opts.ctaUrl)

  // Configure attempt cascade: configured port first, followed by alternate port
  const configurations = [
    { port: rawPort, secure: rawPort === 465, requireTLS: rawPort !== 465 },
    ...(rawPort === 587
      ? [{ port: 465, secure: true, requireTLS: false }]
      : [{ port: 587, secure: false, requireTLS: true }]),
  ]

  const attempts: Array<{ port: number; secure: boolean; error?: string; ok: boolean }> = []

  for (const config of configurations) {
    let transporter: nodemailer.Transporter | null = null
    try {
      console.log(`[Email] Sending "${opts.subject}" → ${opts.to} via port ${config.port} (secure: ${config.secure})...`)
      transporter = createTransporter(config)
      const info = await transporter.sendMail({
        from: fromAddress,
        to: opts.to,
        subject: opts.subject,
        html,
        replyTo: smtpUser,
      })
      transporter.close()
      console.log(`[Email] ✓ Sent "${opts.subject}" → ${opts.to} (port: ${config.port}) messageId=${info.messageId}`)
      attempts.push({ port: config.port, secure: config.secure, ok: true })
      return { success: true, messageId: info.messageId, attempts }
    } catch (err: unknown) {
      if (transporter) {
        try { (transporter as nodemailer.Transporter).close() } catch {}
      }
      const e = err as { code?: string; response?: string; message?: string; command?: string }
      const errSummary = `${e?.code || 'ERROR'}: ${e?.message || String(err)}${e?.response ? ` [${e.response}]` : ''}`
      console.error(`[Email] ✗ Failed on port ${config.port}: ${errSummary}`)
      attempts.push({ port: config.port, secure: config.secure, error: errSummary, ok: false })
    }
  }

  const lastError = attempts[attempts.length - 1]?.error || 'All SMTP connection attempts failed'
  return { success: false, error: lastError, attempts }
}

export async function sendEmail(opts: {
  to: string
  subject: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}): Promise<boolean> {
  const result = await sendEmailDetailed(opts)
  return result.success
}

async function getFormattedWhatsAppPhone(email: string, rawPhone: string | null | undefined): Promise<string> {
  if (!rawPhone) return ''
  let cleanPhone = rawPhone.replace(/[\s\-().]/g, '')

  if (cleanPhone.startsWith('+')) {
    return cleanPhone.slice(1)
  }
  if (cleanPhone.startsWith('00')) {
    return cleanPhone.slice(2)
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { country: true }
    })
    
    const dialCode = user?.country?.dialCode?.replace('+', '') || '92'
    
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1)
    }
    
    if (!cleanPhone.startsWith(dialCode)) {
      return `${dialCode}${cleanPhone}`
    }
    
    return cleanPhone
  } catch (err) {
    console.warn('[WhatsApp Format] Database lookup failed, using fallback:', err)
    if (cleanPhone.startsWith('0')) {
      return '92' + cleanPhone.slice(1)
    }
    return cleanPhone
  }
}

export function buildWhatsAppNotificationUrl(phone: string, message: string): string {
  const digits = phone.replace(/[\s+\-().]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const notifications = {

  async userApproved(to: string, phone: string, fullName?: string) {
    const msg = `Hello ${fullName || 'there'} 👋\n\nYour NextTripy account has been approved! You can now browse listings and contact providers directly.\n\nLogin at: ${APP_URL()}/auth`
    const emailSent = await sendEmail({
      to,
      subject: '🎉 Your NextTripy Account Is Approved!',
      title: `Welcome to NextTripy, ${fullName || 'there'}!`,
      bodyHtml: `Your account has been reviewed and <strong style="color:#34d399;">approved</strong> by our team. You can now browse car and hotel listings, contact providers via WhatsApp, and enjoy a seamless experience.`,
      ctaLabel: 'Browse Marketplace',
      ctaUrl: `${APP_URL()}/marketplace`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async userRejected(to: string, phone: string) {
    const msg = `Hello,\n\nYour NextTripy account application was not approved at this time. For assistance please contact info@nexttripy.com`
    const emailSent = await sendEmail({
      to,
      subject: 'NextTripy Account Application Update',
      title: 'Account Application — Update',
      bodyHtml: `After reviewing your application, we were unable to approve your account at this time. If you believe this is an error or would like to provide additional information, please reach out to <strong>info@nexttripy.com</strong>.`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async userSuspended(to: string, phone: string) {
    const msg = `Hello,\n\nYour NextTripy account has been suspended. For assistance please contact info@nexttripy.com`
    const emailSent = await sendEmail({
      to,
      subject: 'NextTripy Account Suspended',
      title: 'Account Suspended',
      bodyHtml: `Your NextTripy account has been temporarily suspended by an administrator. Please contact <strong>info@nexttripy.com</strong> to resolve this.`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async companyApproved(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName} 🎉\n\nYour profile on NextTripy has been APPROVED! Log in to your dashboard to subscribe and start listing.\n\nLogin: ${APP_URL()}/auth`
    const emailSent = await sendEmail({
      to,
      subject: `🎉 ${companyName} — NextTripy Profile Approved!`,
      title: `${companyName} — Approved!`,
      bodyHtml: `Congratulations! Your profile has been <strong style="color:#34d399;">approved</strong> by our admin team.<br><br>
        You can now:<br>
        ✅ Subscribe to the Standard Plan<br>
        ✅ Start listing on the marketplace<br>
        ✅ Receive inquiries directly via WhatsApp<br>
        ✅ Build your customer review profile`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/auth`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async companyRejected(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName},\n\nYour NextTripy company application was not approved at this time. Please contact info@nexttripy.com for details.`
    const emailSent = await sendEmail({
      to,
      subject: `${companyName} — NextTripy Application Update`,
      title: 'Company Application Not Approved',
      bodyHtml: `Unfortunately, your company application for <strong>${companyName}</strong> was not approved at this time. This may be due to incomplete information or documentation issues.<br><br>Please contact <strong>info@nexttripy.com</strong> with your business license and CNIC/ID for assistance.`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async companySuspended(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName},\n\nYour NextTripy account has been suspended. Contact info@nexttripy.com for assistance.`
    const emailSent = await sendEmail({
      to,
      subject: `${companyName} — NextTripy Account Suspended`,
      title: 'Company Account Suspended',
      bodyHtml: `Your account for <strong>${companyName}</strong> has been temporarily suspended by an administrator. Your listings are hidden until the suspension is lifted.<br><br>Contact <strong>info@nexttripy.com</strong> to resolve this.`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async carApproved(to: string, phone: string, carName: string) {
    const msg = `Great news! ✅\n\nYour vehicle listing for "${carName}" on NextTripy has been APPROVED and is now live on the marketplace!\n\nView it at: ${APP_URL()}/marketplace`
    const emailSent = await sendEmail({
      to,
      subject: `✅ "${carName}" is now live on NextTripy!`,
      title: 'Car Listing Approved',
      bodyHtml: `Your vehicle listing for <strong>${carName}</strong> has been approved and is now <strong style="color:#34d399;">live on the NextTripy Marketplace</strong>. Customers can now find and contact you directly.`,
      ctaLabel: 'View Marketplace',
      ctaUrl: `${APP_URL()}/marketplace`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async carRejected(to: string, phone: string, carName: string) {
    const msg = `Hello,\n\nYour vehicle listing for "${carName}" on NextTripy was not approved. Please review the listing details and resubmit. Contact info@nexttripy.com for help.`
    const emailSent = await sendEmail({
      to,
      subject: `NextTripy — Listing "${carName}" Not Approved`,
      title: 'Car Listing Not Approved',
      bodyHtml: `Your vehicle listing for <strong>${carName}</strong> was not approved at this time. This may be due to:<br><br>
        • Incomplete vehicle information<br>
        • Low-quality or insufficient images<br>
        • Missing registration details<br><br>
        Please update the listing from your dashboard and resubmit.`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/auth`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async carSuspended(to: string, phone: string, carName: string) {
    const msg = `Hello,\n\nYour listing "${carName}" on NextTripy has been suspended. Contact info@nexttripy.com for assistance.`
    const emailSent = await sendEmail({
      to,
      subject: `NextTripy — Listing "${carName}" Suspended`,
      title: 'Car Listing Suspended',
      bodyHtml: `Your vehicle listing for <strong>${carName}</strong> has been temporarily suspended by an admin. Please contact <strong>info@nexttripy.com</strong> for details.`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async roomApproved(to: string, phone: string, roomName: string) {
    const msg = `Great news! ✅\n\nYour hotel room listing for "${roomName}" on NextTripy has been APPROVED and is now live on the marketplace!\n\nView it at: ${APP_URL()}/marketplace`
    const emailSent = await sendEmail({
      to,
      subject: `✅ Room "${roomName}" is now live on NextTripy!`,
      title: 'Room Listing Approved',
      bodyHtml: `Your hotel room listing for <strong>${roomName}</strong> has been approved and is now <strong style="color:#34d399;">live on the NextTripy Marketplace</strong>. Customers can now find and book your room directly.`,
      ctaLabel: 'View Marketplace',
      ctaUrl: `${APP_URL()}/marketplace`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async roomRejected(to: string, phone: string, roomName: string) {
    const msg = `Hello,\n\nYour hotel room listing for "${roomName}" on NextTripy was not approved. Please review the listing details and resubmit. Contact info@nexttripy.com for help.`
    const emailSent = await sendEmail({
      to,
      subject: `NextTripy — Room "${roomName}" Not Approved`,
      title: 'Room Listing Not Approved',
      bodyHtml: `Your hotel room listing for <strong>${roomName}</strong> was not approved at this time. This may be due to:<br><br>
        • Incomplete room information or specifications<br>
        • Low-quality or insufficient images<br>
        • Pricing mismatch<br><br>
        Please update the listing from your dashboard and resubmit.`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/auth`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async roomSuspended(to: string, phone: string, roomName: string) {
    const msg = `Hello,\n\nYour room listing "${roomName}" on NextTripy has been suspended. Contact info@nexttripy.com for assistance.`
    const emailSent = await sendEmail({
      to,
      subject: `NextTripy — Room "${roomName}" Suspended`,
      title: 'Room Listing Suspended',
      bodyHtml: `Your hotel room listing for <strong>${roomName}</strong> has been temporarily suspended by an admin. Please contact <strong>info@nexttripy.com</strong> for details.`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },


  async subscriptionActivated(to: string, phone: string, companyName: string, endDate: string) {
    const msg = `Hello ${companyName} ✅\n\nYour NextTripy subscription has been activated! Your account is now active until ${endDate}. You can start listing from now: ${APP_URL()}/auth`
    const emailSent = await sendEmail({
      to,
      subject: '✅ NextTripy Subscription Activated',
      title: 'Subscription Activated',
      bodyHtml: `Your payment has been verified and your NextTripy subscription for <strong>${companyName}</strong> is now <strong style="color:#34d399;">active until ${endDate}</strong>.<br><br>You can start listing on the marketplace from now and receive customer inquiries.`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/auth`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async subscriptionDeactivated(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName},\n\nYour NextTripy subscription has been deactivated. Your listings are currently hidden. Contact info@nexttripy.com for help.`
    const emailSent = await sendEmail({
      to,
      subject: 'NextTripy Subscription Deactivated',
      title: 'Subscription Deactivated',
      bodyHtml: `Your NextTripy subscription for <strong>${companyName}</strong> has been deactivated by an administrator. Your listings are currently hidden from customers.<br><br>Contact <strong>info@nexttripy.com</strong> to resolve this or renew your subscription from the dashboard.`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/auth`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },

  async paymentRejected(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName},\n\nYour NextTripy subscription payment could not be verified. Please contact info@nexttripy.com or resubmit your payment from the dashboard.`
    const emailSent = await sendEmail({
      to,
      subject: 'NextTripy — Payment Could Not Be Verified',
      title: 'Payment Verification Failed',
      bodyHtml: `The subscription payment submitted for <strong>${companyName}</strong> could not be verified. This may be due to an incorrect transaction ID or amount mismatch.<br><br>Please contact <strong>info@nexttripy.com</strong> or resubmit your payment from the dashboard.`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/auth`,
    })
    const formattedPhone = await getFormattedWhatsAppPhone(to, phone)
    return { emailSent, whatsAppUrl: buildWhatsAppNotificationUrl(formattedPhone, msg) }
  },
}

import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
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
                  <div style="width:40px;height:40px;background:rgba(255,255,255,0.25);border-radius:10px;text-align:center;line-height:40px;font-size:20px;font-weight:900;color:#fff;display:inline-block;">D</div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">DriveHub</span>
                </td>
              </tr>
            </table>
            <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:8px 0 0;letter-spacing:1px;text-transform:uppercase;">Marketplace Notification</p>
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
                <p style="color:#475569;font-size:12px;margin:0;">DriveHub Marketplace &bull; Global Car Rental Platform</p>
                <p style="color:#334155;font-size:11px;margin:6px 0 0;">This is an automated message, please do not reply directly. For support: <a href="mailto:support@drivehub.com" style="color:#6366f1;">support@drivehub.com</a></p>
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

export async function sendEmail(opts: {
  to: string
  subject: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP_USER / SMTP_PASS not configured — skipping email to', opts.to)
    return
  }

  try {
    const transporter = createTransporter()
    const fromAddress = process.env.SMTP_FROM || `"DriveHub Marketplace" <${process.env.SMTP_USER}>`
    await transporter.sendMail({
      from: fromAddress,
      to: opts.to,
      subject: opts.subject,
      html: buildHtml(opts.title, opts.bodyHtml, opts.ctaLabel, opts.ctaUrl),
    })
    console.log(`[Email] ✓ Sent "${opts.subject}" → ${opts.to}`)
  } catch (err) {
    console.error('[Email] ✗ Failed to send notification:', err)
  }
}

export function buildWhatsAppNotificationUrl(phone: string, message: string): string {
  const digits = phone.replace(/[\s+\-().]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const notifications = {

  async userApproved(to: string, phone: string, fullName?: string) {
    const msg = `Hello ${fullName || 'there'} 👋\n\nYour DriveHub account has been approved! You can now browse and contact car rental companies directly.\n\nLogin at: ${APP_URL()}/auth`
    await sendEmail({
      to,
      subject: '🎉 Your DriveHub Account Is Approved!',
      title: `Welcome to DriveHub, ${fullName || 'there'}!`,
      bodyHtml: `Your account has been reviewed and <strong style="color:#34d399;">approved</strong> by our team. You can now browse car listings, contact companies via WhatsApp, and enjoy a seamless rental experience.`,
      ctaLabel: 'Start Browsing Cars',
      ctaUrl: `${APP_URL()}/marketplace`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async userRejected(to: string, phone: string) {
    const msg = `Hello,\n\nYour DriveHub account application was not approved at this time. For assistance please contact support@drivehub.com`
    await sendEmail({
      to,
      subject: 'DriveHub Account Application Update',
      title: 'Account Application — Update',
      bodyHtml: `After reviewing your application, we were unable to approve your account at this time. If you believe this is an error or would like to provide additional information, please reach out to <strong>support@drivehub.com</strong>.`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async userSuspended(to: string, phone: string) {
    const msg = `Hello,\n\nYour DriveHub account has been suspended. For assistance please contact support@drivehub.com`
    await sendEmail({
      to,
      subject: 'DriveHub Account Suspended',
      title: 'Account Suspended',
      bodyHtml: `Your DriveHub account has been temporarily suspended by an administrator. Please contact <strong>support@drivehub.com</strong> to resolve this.`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async companyApproved(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName} 🎉\n\nYour company profile on DriveHub has been APPROVED! Log in to your dashboard to subscribe and start listing your vehicles.\n\nDashboard: ${APP_URL()}/dashboard/company`
    await sendEmail({
      to,
      subject: `🎉 ${companyName} — DriveHub Profile Approved!`,
      title: `${companyName} — Approved!`,
      bodyHtml: `Congratulations! Your company profile has been <strong style="color:#34d399;">approved</strong> by our admin team.<br><br>
        You can now:<br>
        ✅ Subscribe to the Standard Plan<br>
        ✅ Add up to 10 car listings<br>
        ✅ Receive inquiries directly via WhatsApp<br>
        ✅ Build your customer review profile`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/dashboard/company`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async companyRejected(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName},\n\nYour DriveHub company application was not approved at this time. Please contact support@drivehub.com for details.`
    await sendEmail({
      to,
      subject: `${companyName} — DriveHub Application Update`,
      title: 'Company Application Not Approved',
      bodyHtml: `Unfortunately, your company application for <strong>${companyName}</strong> was not approved at this time. This may be due to incomplete information or documentation issues.<br><br>Please contact <strong>support@drivehub.com</strong> with your business license and CNIC/ID for assistance.`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async companySuspended(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName},\n\nYour DriveHub company account has been suspended. Contact support@drivehub.com for assistance.`
    await sendEmail({
      to,
      subject: `${companyName} — DriveHub Account Suspended`,
      title: 'Company Account Suspended',
      bodyHtml: `Your company account for <strong>${companyName}</strong> has been temporarily suspended by an administrator. Your car listings are hidden until the suspension is lifted.<br><br>Contact <strong>support@drivehub.com</strong> to resolve this.`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async carApproved(to: string, phone: string, carName: string) {
    const msg = `Great news! ✅\n\nYour vehicle listing for "${carName}" on DriveHub has been APPROVED and is now live on the marketplace!\n\nView it at: ${APP_URL()}/marketplace`
    await sendEmail({
      to,
      subject: `✅ "${carName}" is now live on DriveHub!`,
      title: 'Car Listing Approved',
      bodyHtml: `Your vehicle listing for <strong>${carName}</strong> has been approved and is now <strong style="color:#34d399;">live on the DriveHub marketplace</strong>. Customers can now find and contact you directly.`,
      ctaLabel: 'View Marketplace',
      ctaUrl: `${APP_URL()}/marketplace`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async carRejected(to: string, phone: string, carName: string) {
    const msg = `Hello,\n\nYour vehicle listing for "${carName}" on DriveHub was not approved. Please review the listing details and resubmit. Contact support@drivehub.com for help.`
    await sendEmail({
      to,
      subject: `DriveHub — Listing "${carName}" Not Approved`,
      title: 'Car Listing Not Approved',
      bodyHtml: `Your vehicle listing for <strong>${carName}</strong> was not approved at this time. This may be due to:<br><br>
        • Incomplete vehicle information<br>
        • Low-quality or insufficient images<br>
        • Missing registration details<br><br>
        Please update the listing from your dashboard and resubmit.`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/dashboard/company`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async carSuspended(to: string, phone: string, carName: string) {
    const msg = `Hello,\n\nYour listing "${carName}" on DriveHub has been suspended. Contact support@drivehub.com for assistance.`
    await sendEmail({
      to,
      subject: `DriveHub — Listing "${carName}" Suspended`,
      title: 'Car Listing Suspended',
      bodyHtml: `Your vehicle listing for <strong>${carName}</strong> has been temporarily suspended by an admin. Please contact <strong>support@drivehub.com</strong> for details.`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async subscriptionActivated(to: string, phone: string, companyName: string, endDate: string) {
    const msg = `Hello ${companyName} ✅\n\nYour DriveHub subscription has been activated! Your account is now active until ${endDate}. Start adding your cars now: ${APP_URL()}/dashboard/company`
    await sendEmail({
      to,
      subject: '✅ DriveHub Subscription Activated',
      title: 'Subscription Activated',
      bodyHtml: `Your payment has been verified and your DriveHub subscription for <strong>${companyName}</strong> is now <strong style="color:#34d399;">active until ${endDate}</strong>.<br><br>You can now list up to 10 vehicles and start receiving customer inquiries.`,
      ctaLabel: 'Manage Fleet',
      ctaUrl: `${APP_URL()}/dashboard/company`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async subscriptionDeactivated(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName},\n\nYour DriveHub subscription has been deactivated. Your listings are currently hidden. Contact support@drivehub.com for help.`
    await sendEmail({
      to,
      subject: 'DriveHub Subscription Deactivated',
      title: 'Subscription Deactivated',
      bodyHtml: `Your DriveHub subscription for <strong>${companyName}</strong> has been deactivated by an administrator. Your vehicle listings are currently hidden from customers.<br><br>Contact <strong>support@drivehub.com</strong> to resolve this or renew your subscription from the dashboard.`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/dashboard/company`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },

  async paymentRejected(to: string, phone: string, companyName: string) {
    const msg = `Hello ${companyName},\n\nYour DriveHub subscription payment could not be verified. Please contact support@drivehub.com or resubmit your payment from the dashboard.`
    await sendEmail({
      to,
      subject: 'DriveHub — Payment Could Not Be Verified',
      title: 'Payment Verification Failed',
      bodyHtml: `The subscription payment submitted for <strong>${companyName}</strong> could not be verified. This may be due to an incorrect transaction ID or amount mismatch.<br><br>Please contact <strong>support@drivehub.com</strong> or resubmit your payment from the dashboard.`,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: `${APP_URL()}/dashboard/company`,
    })
    return buildWhatsAppNotificationUrl(phone, msg)
  },
}

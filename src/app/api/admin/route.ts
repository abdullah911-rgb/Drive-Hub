import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifications } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

// ──────────────────────────────────────────────────────────────────────────────
// Admin: get all users, companies, cars, payments with stats
// ──────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')

    if (resource === 'stats') {
      const stats = await db.getStats()
      return NextResponse.json({ success: true, data: stats })
    }
    if (resource === 'users') {
      const users = await db.getUsers()
      return NextResponse.json({ success: true, data: users })
    }
    if (resource === 'companies') {
      const companies = await db.getCompanies()
      return NextResponse.json({ success: true, data: companies })
    }
    if (resource === 'cars') {
      const cars = await db.getCars({})
      return NextResponse.json({ success: true, data: cars })
    }
    if (resource === 'payments') {
      const payments = await db.getPayments()
      return NextResponse.json({ success: true, data: payments })
    }
    if (resource === 'reviews') {
      const reviews = await db.getAllReviews()
      return NextResponse.json({ success: true, data: reviews })
    }

    return NextResponse.json({ success: false, error: 'Unknown resource' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Admin fetch failed' }, { status: 500 })
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Admin: approve / reject / suspend / ban resources
// Returns whatsAppUrl so the admin frontend can show a one-tap send button
// ──────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { resource, id, action } = body
    let whatsAppUrl: string | null = null

    // ── USER ────────────────────────────────────────────────────────────────
    if (resource === 'user') {
      const statusMap: Record<string, string> = {
        approve: 'APPROVED', reject: 'REJECTED', suspend: 'SUSPENDED', ban: 'BANNED', restore: 'APPROVED',
      }
      const user = await db.updateUser(id, { status: statusMap[action] })
      if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

      // In-app notification
      await db.createNotification({
        id: uuidv4(), userId: id,
        type: action === 'approve' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
        title: action === 'approve' ? 'Account Approved' : `Account ${action}ed`,
        message: action === 'approve'
          ? 'Your account has been approved! Welcome to DriveHub.'
          : `Your account has been ${action}ed by admin.`,
        isRead: false,
      })

      // Email + WhatsApp notification
      const u = user as { email: string; phone: string; fullName?: string }
      if (action === 'approve') {
        whatsAppUrl = await notifications.userApproved(u.email, u.phone, u.fullName)
      } else if (action === 'reject') {
        whatsAppUrl = await notifications.userRejected(u.email, u.phone)
      } else if (action === 'suspend') {
        whatsAppUrl = await notifications.userSuspended(u.email, u.phone)
      }

      return NextResponse.json({ success: true, data: user, whatsAppUrl })
    }

    // ── COMPANY ─────────────────────────────────────────────────────────────
    if (resource === 'company') {
      const statusMap: Record<string, string> = {
        approve: 'APPROVED', reject: 'REJECTED', suspend: 'SUSPENDED', restore: 'APPROVED',
      }

      // Sub-actions: activate / deactivate subscription
      if (action === 'activate_sub' || action === 'deactivate_sub') {
        const company = await db.getCompanyById(id)
        if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
        const c = company as { id: string; userId: string; name: string }

        let sub = await db.getSubscriptionByCompanyId(c.id)
        if (action === 'activate_sub') {
          const startDate = new Date().toISOString()
          const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          if (sub) {
            sub = await db.updateSubscription((sub as { id: string }).id, { status: 'ACTIVE', startDate, endDate })
          } else {
            sub = await db.createSubscription({
              id: uuidv4(), companyId: c.id, planName: 'Standard Plan', maxCars: 10, price: 99,
              durationDays: 30,
              features: ['Up to 10 car listings', 'WhatsApp integration', 'Company profile page', 'Customer reviews'],
              status: 'ACTIVE', startDate, endDate,
            })
          }
          await db.createNotification({
            id: uuidv4(), userId: c.userId, type: 'GENERAL',
            title: 'Subscription Activated',
            message: 'Your company subscription has been activated. You can now list and manage your fleet!',
            isRead: false,
          })
          // Email + WhatsApp
          const user = await db.getUserById(c.userId) as { email: string; phone: string } | null
          if (user) {
            const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            whatsAppUrl = await notifications.subscriptionActivated(user.email, user.phone, c.name, expiry)
          }
        } else {
          if (sub) {
            sub = await db.updateSubscription((sub as { id: string }).id, { status: 'EXPIRED' })
          }
          await db.createNotification({
            id: uuidv4(), userId: c.userId, type: 'GENERAL',
            title: 'Subscription Deactivated',
            message: 'Your company subscription has been deactivated. Your listings are currently hidden.',
            isRead: false,
          })
          const user = await db.getUserById(c.userId) as { email: string; phone: string } | null
          if (user) {
            whatsAppUrl = await notifications.subscriptionDeactivated(user.email, user.phone, c.name)
          }
        }
        return NextResponse.json({ success: true, data: sub, whatsAppUrl })
      }

      // Normal approve / reject / suspend
      const company = await db.updateCompany(id, { status: statusMap[action] })
      if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
      const c = company as { id: string; userId: string; name: string }

      await db.updateUser(c.userId, { status: statusMap[action] })
      await db.createNotification({
        id: uuidv4(), userId: c.userId,
        type: action === 'approve' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
        title: action === 'approve' ? 'Company Approved' : `Company ${action}ed`,
        message: action === 'approve'
          ? 'Your company has been approved! You can now subscribe and list cars.'
          : `Your company has been ${action}ed.`,
        isRead: false,
      })

      const user = await db.getUserById(c.userId) as { email: string; phone: string } | null
      if (user) {
        if (action === 'approve') {
          whatsAppUrl = await notifications.companyApproved(user.email, user.phone, c.name)
        } else if (action === 'reject') {
          whatsAppUrl = await notifications.companyRejected(user.email, user.phone, c.name)
        } else if (action === 'suspend') {
          whatsAppUrl = await notifications.companySuspended(user.email, user.phone, c.name)
        }
      }
      return NextResponse.json({ success: true, data: company, whatsAppUrl })
    }

    // ── CAR ─────────────────────────────────────────────────────────────────
    if (resource === 'car') {
      const statusMap: Record<string, string> = { approve: 'APPROVED', reject: 'REJECTED', suspend: 'SUSPENDED' }
      const car = await db.updateCar(id, { status: statusMap[action] })
      if (!car) return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 })
      const c = car as { companyId: string; name: string }

      const company = await db.getCompanyById(c.companyId)
      if (company) {
        const co = company as { userId: string; name: string }
        await db.createNotification({
          id: uuidv4(), userId: co.userId,
          type: action === 'approve' ? 'CAR_APPROVED' : 'CAR_REJECTED',
          title: action === 'approve' ? 'Car Listing Approved' : 'Car Listing Rejected',
          message: action === 'approve'
            ? `Your ${c.name} listing is now live on the marketplace!`
            : `Your ${c.name} listing was not approved.`,
          isRead: false,
        })
        const user = await db.getUserById(co.userId) as { email: string; phone: string } | null
        if (user) {
          if (action === 'approve') {
            whatsAppUrl = await notifications.carApproved(user.email, user.phone, c.name)
          } else if (action === 'reject') {
            whatsAppUrl = await notifications.carRejected(user.email, user.phone, c.name)
          } else if (action === 'suspend') {
            whatsAppUrl = await notifications.carSuspended(user.email, user.phone, c.name)
          }
        }
      }
      return NextResponse.json({ success: true, data: car, whatsAppUrl })
    }

    // ── PAYMENT ─────────────────────────────────────────────────────────────
    if (resource === 'payment') {
      // Direct lookup — avoids fetching ALL payments just to find one
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { subscription: { include: { company: true } } },
      })
      if (!payment) return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })

      const companyRecord = (payment.subscription as { company: { id: string; userId: string; name: string } }).company

      if (action === 'verify') {
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const sub = await db.updateSubscription(payment.subscriptionId, {
          status: 'ACTIVE',
          startDate: new Date().toISOString(),
          endDate: endDate.toISOString(),
        })
        await db.updatePayment(id, { status: 'PAID', verifiedAt: new Date().toISOString() })

        // Notify company
        await db.createNotification({
          id: uuidv4(), userId: companyRecord.userId, type: 'GENERAL',
          title: 'Payment Verified — Subscription Active',
          message: 'Your subscription payment has been verified. Your account is now active!',
          isRead: false,
        })
        const user = await db.getUserById(companyRecord.userId) as { email: string; phone: string } | null
        if (user) {
          const expiry = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          whatsAppUrl = await notifications.subscriptionActivated(user.email, user.phone, companyRecord.name, expiry)
        }
        return NextResponse.json({ success: true, data: sub, whatsAppUrl })
      }

      if (action === 'reject') {
        const sub = await db.updateSubscription(payment.subscriptionId, { status: 'CANCELLED' })
        await db.updatePayment(id, { status: 'FAILED' })

        await db.createNotification({
          id: uuidv4(), userId: companyRecord.userId, type: 'GENERAL',
          title: 'Payment Could Not Be Verified',
          message: 'Your subscription payment could not be verified. Please contact support or resubmit.',
          isRead: false,
        })
        const user = await db.getUserById(companyRecord.userId) as { email: string; phone: string } | null
        if (user) {
          whatsAppUrl = await notifications.paymentRejected(user.email, user.phone, companyRecord.name)
        }
        return NextResponse.json({ success: true, data: sub, whatsAppUrl })
      }

      return NextResponse.json({ success: false, error: 'Unknown payment action' }, { status: 400 })
    }

    // ── REVIEW ───────────────────────────────────────────────────────────────
    if (resource === 'review') {
      const review = await db.updateReview(id, { isVisible: action === 'show' })
      if (!review) return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
      return NextResponse.json({ success: true, data: review })
    }

    return NextResponse.json({ success: false, error: 'Unknown resource' }, { status: 400 })
  } catch (error) {
    console.error('Admin PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Admin action failed' }, { status: 500 })
  }
}

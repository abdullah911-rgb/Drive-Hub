import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifications } from '@/lib/email'
import { convertPKR } from '@/lib/currency'
import { SUBSCRIPTION_BASE_PKR } from '@/lib/subscription'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')

    if (resource === 'dashboard') {
      const [stats, users, companies, cars, rooms, payments, reviews, notifications, subscriptions, bankDetails] = await Promise.all([
        db.getStats(),
        db.getUsers(),
        db.getCompanies(),
        db.getCars({}),
        db.getRooms({}),
        db.getPayments(),
        db.getAllReviews(),
        db.getNotificationsByUserId(currentUser.userId),
        db.getAllSubscriptions(),
        db.getBankDetails(),
      ])
      return NextResponse.json({
        success: true,
        data: {
          stats,
          users,
          companies,
          cars,
          rooms,
          payments,
          reviews,
          notifications,
          subscriptions,
          bankDetails,
        },
      })
    }

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
    if (resource === 'rooms') {
      const rooms = await db.getRooms({})
      return NextResponse.json({ success: true, data: rooms })
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

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { resource, id, action } = body
    let whatsAppUrl: string | null = null
    let emailSent = false
    let emailAttempted = false

    if (resource === 'user') {
      const statusMap: Record<string, string> = {
        approve: 'APPROVED', reject: 'REJECTED', suspend: 'SUSPENDED', ban: 'BANNED', restore: 'APPROVED',
      }
      const user = await db.updateUser(id, { status: statusMap[action] })
      if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

      const isApprovedAction = action === 'approve' || action === 'restore'
      await db.createNotification({
        id: uuidv4(), userId: id,
        type: isApprovedAction ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
        title: isApprovedAction ? 'Account Approved' : `Account ${action}ed`,
        message: isApprovedAction
          ? 'Your account has been approved! Welcome to NextTripy.'
          : `Your account has been ${action}ed by admin.`,
        isRead: false,
      })

      const u = user as { email: string; phone: string; fullName?: string }
      if (action === 'approve' || action === 'restore') {
        emailAttempted = true
        const result = await notifications.userApproved(u.email, u.phone, u.fullName)
        whatsAppUrl = result.whatsAppUrl
        emailSent = result.emailSent
      } else if (action === 'reject') {
        emailAttempted = true
        const result = await notifications.userRejected(u.email, u.phone)
        whatsAppUrl = result.whatsAppUrl
        emailSent = result.emailSent
      } else if (action === 'suspend') {
        emailAttempted = true
        const result = await notifications.userSuspended(u.email, u.phone)
        whatsAppUrl = result.whatsAppUrl
        emailSent = result.emailSent
      }

      return NextResponse.json({ success: true, data: user, whatsAppUrl, emailSent, emailAttempted })
    }

    if (resource === 'company') {
      const statusMap: Record<string, string> = {
        approve: 'APPROVED', reject: 'REJECTED', suspend: 'SUSPENDED', restore: 'APPROVED',
      }

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
            const companyRecord = company as { countryId: string; country?: { currency: string } }
            const country = companyRecord.country || (await db.getCountryById(companyRecord.countryId)) as { currency: string } | null
            const currencyCode = country?.currency || 'PKR'
            const { amount: localPrice } = await convertPKR(SUBSCRIPTION_BASE_PKR, currencyCode)
            sub = await db.createSubscription({
              id: uuidv4(), companyId: c.id, planName: 'Standard Plan', maxCars: 10, price: localPrice,
              durationDays: 30,
              features: ['Marketplace listings', 'WhatsApp integration', 'Company profile page', 'Customer reviews'],
              status: 'ACTIVE', startDate, endDate,
            })
          }
          await db.createNotification({
            id: uuidv4(), userId: c.userId, type: 'GENERAL',
            title: 'Subscription Activated',
            message: 'Your subscription has been activated. You can start listing on the marketplace from now!',
            isRead: false,
          })

          const user = await db.getUserById(c.userId) as { email: string; phone: string } | null
          if (user) {
            emailAttempted = true
            const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            const result = await notifications.subscriptionActivated(user.email, user.phone, c.name, expiry)
            whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
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
            emailAttempted = true
            const result = await notifications.subscriptionDeactivated(user.email, user.phone, c.name)
            whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
          }
        }
        return NextResponse.json({ success: true, data: sub, whatsAppUrl, emailSent, emailAttempted })
      }

      const company = await db.updateCompany(id, { status: statusMap[action] })
      if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
      const c = company as { id: string; userId: string; name: string }

      await db.updateUser(c.userId, { status: statusMap[action] })
      const isApprovedAction = action === 'approve' || action === 'restore'
      await db.createNotification({
        id: uuidv4(), userId: c.userId,
        type: isApprovedAction ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
        title: isApprovedAction ? 'Company Approved' : `Company ${action}ed`,
        message: isApprovedAction
          ? 'Your profile has been approved! You can now subscribe and start listing.'
          : `Your company has been ${action}ed.`,
        isRead: false,
      })

      const user = await db.getUserById(c.userId) as { email: string; phone: string } | null
      console.log(`[Admin] Company action=${action} userId=${c.userId} userFound=${!!user} email=${(user as {email?:string})?.email}`)
      if (user) {
        if (action === 'approve' || action === 'restore') {
          emailAttempted = true
          const result = await notifications.companyApproved(user.email, user.phone, c.name)
          whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
        } else if (action === 'reject') {
          emailAttempted = true
          const result = await notifications.companyRejected(user.email, user.phone, c.name)
          whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
        } else if (action === 'suspend') {
          emailAttempted = true
          const result = await notifications.companySuspended(user.email, user.phone, c.name)
          whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
        }
      } else {
        console.error(`[Admin] Could not find user userId=${c.userId} — NO EMAIL SENT`)
      }
      return NextResponse.json({ success: true, data: company, whatsAppUrl, emailSent, emailAttempted })
    }

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
            emailAttempted = true
            const result = await notifications.carApproved(user.email, user.phone, c.name)
            whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
          } else if (action === 'reject') {
            emailAttempted = true
            const result = await notifications.carRejected(user.email, user.phone, c.name)
            whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
          } else if (action === 'suspend') {
            emailAttempted = true
            const result = await notifications.carSuspended(user.email, user.phone, c.name)
            whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
          }
        }
      }
      return NextResponse.json({ success: true, data: car, whatsAppUrl, emailSent, emailAttempted })
    }

    if (resource === 'room') {
      const statusMap: Record<string, string> = { approve: 'APPROVED', reject: 'REJECTED', suspend: 'SUSPENDED' }
      const room = await db.updateRoom(id, { status: statusMap[action] })
      if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
      const r = room as { companyId: string; name: string }

      const company = await db.getCompanyById(r.companyId)
      if (company) {
        const co = company as { userId: string; name: string }
        await db.createNotification({
          id: uuidv4(), userId: co.userId,
          type: action === 'approve' ? 'CAR_APPROVED' : 'CAR_REJECTED',
          title: action === 'approve' ? 'Room Listing Approved' : 'Room Listing Rejected',
          message: action === 'approve'
            ? `Your room "${r.name}" is now live on the marketplace!`
            : `Your room "${r.name}" listing was not approved.`,
          isRead: false,
        })
        const user = await db.getUserById(co.userId) as { email: string; phone: string } | null
        if (user) {
          if (action === 'approve') {
            emailAttempted = true
            const result = await notifications.roomApproved(user.email, user.phone, r.name)
            whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
          } else if (action === 'reject') {
            emailAttempted = true
            const result = await notifications.roomRejected(user.email, user.phone, r.name)
            whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
          } else if (action === 'suspend') {
            emailAttempted = true
            const result = await notifications.roomSuspended(user.email, user.phone, r.name)
            whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
          }
        }
      }
      return NextResponse.json({ success: true, data: room, whatsAppUrl, emailSent, emailAttempted })
    }

    if (resource === 'payment') {

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

        await db.createNotification({
          id: uuidv4(), userId: companyRecord.userId, type: 'GENERAL',
          title: 'Payment Verified — Subscription Active',
          message: 'Your subscription payment has been verified. You can start listing on the marketplace from now!',
          isRead: false,
        })
        const user = await db.getUserById(companyRecord.userId) as { email: string; phone: string } | null
        if (user) {
          emailAttempted = true
          const expiry = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          const result = await notifications.subscriptionActivated(user.email, user.phone, companyRecord.name, expiry)
          whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
        }
        return NextResponse.json({ success: true, data: sub, whatsAppUrl, emailSent, emailAttempted })
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
        const user2 = await db.getUserById(companyRecord.userId) as { email: string; phone: string } | null
        if (user2) {
          emailAttempted = true
          const result = await notifications.paymentRejected(user2.email, user2.phone, companyRecord.name)
          whatsAppUrl = result.whatsAppUrl; emailSent = result.emailSent
        }
        return NextResponse.json({ success: true, data: sub, whatsAppUrl, emailSent, emailAttempted })
      }

      return NextResponse.json({ success: false, error: 'Unknown payment action' }, { status: 400 })
    }

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

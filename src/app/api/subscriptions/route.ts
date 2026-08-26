import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { convertPKR } from '@/lib/currency'
import { SUBSCRIPTION_BASE_PKR } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const subs = await db.getAllSubscriptions()
    return NextResponse.json({ success: true, data: subs })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'COMPANY') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const company = await db.getCompanyByUserId(currentUser.userId)
    if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })

    const c = company as { id: string; name: string; countryId: string; country?: { currency: string } }
    const existing = await db.getSubscriptionByCompanyId(c.id)
    if (existing && (existing as { status: string }).status === 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Active subscription already exists' }, { status: 409 })
    }

    const country = c.country || (await db.getCountryById(c.countryId)) as { currency: string } | null
    const currencyCode = country?.currency || 'PKR'

    const { amount: localPrice, rate } = await convertPKR(SUBSCRIPTION_BASE_PKR, currencyCode)

    const sub = await db.createSubscription({
      companyId: c.id,
      planName: 'Standard Plan',
      maxCars: 9999,
      price: localPrice,
      durationDays: 30,
      features: ['Marketplace listings', 'WhatsApp integration', 'Company profile page', 'Customer reviews'],
      status: 'PENDING',
    })

    await db.createPayment({
      subscriptionId: (sub as { id: string }).id,
      amount: body.amount || localPrice,
      currency: currencyCode,
      gateway: body.gateway,
      transactionId: body.transactionId || `TXN-${Date.now()}`,
      accountDetails: body.accountDetails,
      receiptUrl: body.receiptUrl,
      status: 'PENDING',
    })

    const admin = await db.getAdminUser()
    if (admin) {
      await db.createNotification({
        userId: (admin as { id: string }).id,
        type: 'GENERAL',
        title: 'New Subscription Payment',
        message: `${c.name} submitted a subscription payment of ${localPrice.toFixed(2)} ${currencyCode} (Rs. ${SUBSCRIPTION_BASE_PKR.toLocaleString()} PKR) via ${body.gateway}. Verification required.`,
        isRead: false,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        sub,
        price: localPrice,
        currency: currencyCode,
        pricePKR: SUBSCRIPTION_BASE_PKR,
        rate,
        message: 'Payment submitted. Awaiting admin verification.',
      },
    })
  } catch (error) {
    console.error('Subscription POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create subscription' }, { status: 500 })
  }
}

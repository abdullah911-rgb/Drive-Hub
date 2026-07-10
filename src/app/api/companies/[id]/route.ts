import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePrisma } from '@/lib/serialize'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'

    let isOwner = false
    if (currentUser?.role === 'COMPANY' || currentUser?.role === 'HOTEL') {
      const ownCompany = await db.getCompanyByUserId(currentUser.userId)
      isOwner = (ownCompany as { id: string } | null)?.id === id
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        city: true,
        country: true,
        reviews: {
          where: { isVisible: true },
          include: { user: true },
        },
        cars: {
          where: {
            deletedAt: null,
            ...(!isAdmin && !isOwner ? { status: 'APPROVED' as const } : {}),
          },
          include: { images: true, city: true, country: true },
        },
        rooms: {
          where: {
            deletedAt: null,
            ...(!isAdmin && !isOwner ? { status: 'APPROVED' as const } : {}),
          },
          include: { images: true, city: true, country: true },
        },
        subscriptions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })

    if (!isAdmin && !isOwner && company.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
    }

    const reviews = company.reviews
    const enrichedReviews = reviews.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      userId: r.userId,
      rating: r.rating,
      comment: r.comment,
      isVisible: r.isVisible,
      createdAt: r.createdAt,
      user: r.user ? { fullName: r.user.fullName || 'Anonymous Customer', email: r.user.email } : null,
    }))

    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
    const latestSubscription = company.subscriptions[0] || null

    return NextResponse.json({
      success: true,
      data: serializePrisma({
        ...company,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        totalCars: company.cars.length,
        totalRooms: company.rooms.length,
        reviews: enrichedReviews,
        subscriptions: latestSubscription ? [latestSubscription] : [],
      }),
    })
  } catch (error) {
    console.error('Company detail GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch company' }, { status: 404 })
  }
}

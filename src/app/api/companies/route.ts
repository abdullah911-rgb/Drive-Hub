import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePrisma } from '@/lib/serialize'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'

    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId') || undefined
    const cityId = searchParams.get('cityId') || undefined
    const status = isAdmin ? (searchParams.get('status') || undefined) : 'APPROVED'
    const search = searchParams.get('search') || undefined

    const where: Record<string, unknown> = { deletedAt: null }
    if (countryId) where.countryId = countryId
    if (cityId) where.cityId = cityId
    if (status) where.status = status

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { businessAddress: { contains: search, mode: 'insensitive' } },
      ]
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        city: true,
        country: true,
        reviews: { where: { isVisible: true } },
        cars: { where: { status: 'APPROVED', deletedAt: null } },
        subscriptions: { orderBy: { createdAt: 'desc' } },
      },
    })

    const enriched = companies.map((company) => {
      const avgRating = company.reviews.length
        ? company.reviews.reduce((s, r) => s + r.rating, 0) / company.reviews.length
        : 0
      return {
        ...company,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: company.reviews.length,
        totalCars: company.cars.length,
      }
    })

    return NextResponse.json({ success: true, data: serializePrisma(enriched) })
  } catch (error) {
    console.error('Companies GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch companies' }, { status: 500 })
  }
}

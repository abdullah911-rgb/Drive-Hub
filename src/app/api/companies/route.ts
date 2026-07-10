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
    const companyType = searchParams.get('companyType') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), isAdmin ? 500 : 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const lite = searchParams.get('lite') !== 'false'

    const where: Record<string, unknown> = { deletedAt: null }
    if (countryId) where.countryId = countryId
    if (cityId) where.cityId = cityId
    if (status) where.status = status
    if (companyType) where.companyType = companyType as 'CAR_RENTAL' | 'HOTEL'

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { businessAddress: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: lite && !isAdmin
          ? {
              id: true,
              name: true,
              status: true,
              companyType: true,
              whatsAppNumber: true,
              businessAddress: true,
              country: { select: { name: true, code: true } },
              city: { select: { name: true } },
              reviews: { where: { isVisible: true }, select: { rating: true } },
              _count: {
                select: {
                  cars: { where: { status: 'APPROVED', deletedAt: null } },
                  rooms: { where: { status: 'APPROVED', deletedAt: null } },
                }
              },
            }
          : {
              id: true,
              name: true,
              status: true,
              companyType: true,
              ownerName: true,
              whatsAppNumber: true,
              businessAddress: true,
              licenseNumber: true,
              country: true,
              city: true,
              reviews: { where: { isVisible: true } },
              cars: { where: { status: 'APPROVED', deletedAt: null }, include: { images: { take: 1 } } },
              rooms: { where: { status: 'APPROVED', deletedAt: null }, include: { images: { take: 1 } } },
              subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
      }),
      prisma.company.count({ where }),
    ])

    const enriched = companies.map((company) => {
      const reviews = 'reviews' in company ? company.reviews : []
      const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0
      let totalCars = 0
      let totalRooms = 0
      if ('_count' in company && company._count && typeof company._count === 'object') {
        if ('cars' in company._count) {
          totalCars = (company._count as { cars: number }).cars
        }
        if ('rooms' in company._count) {
          totalRooms = (company._count as { rooms: number }).rooms
        }
      } else {
        if ('cars' in company && Array.isArray(company.cars)) {
          totalCars = company.cars.length
        }
        if ('rooms' in company && Array.isArray(company.rooms)) {
          totalRooms = company.rooms.length
        }
      }
      const { reviews: _r, _count, ...rest } = company as typeof company & { _count?: { cars: number; rooms: number }; reviews: { rating: number }[] }
      return {
        ...rest,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        totalCars,
        totalRooms,
      }
    })

    return NextResponse.json({
      success: true,
      data: serializePrisma(enriched),
      pagination: { total, limit, offset, hasMore: offset + companies.length < total },
    })
  } catch (error) {
    console.error('Companies GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch companies' }, { status: 500 })
  }
}

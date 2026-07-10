import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePrisma } from '@/lib/serialize'
import { getCurrentUser } from '@/lib/auth'

const listInclude = {
  images: { take: 1, orderBy: { isPrimary: 'desc' as const } },
  country: { select: { id: true, name: true, code: true } },
  city: { select: { id: true, name: true } },
  company: {
    select: {
      id: true,
      name: true,
      whatsAppNumber: true,
      status: true,
      country: { select: { name: true } },
    },
  },
}

const fullInclude = {
  images: true,
  country: true,
  city: true,
  company: {
    include: {
      country: true,
      city: true,
      subscriptions: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'

    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId') || undefined
    const cityId = searchParams.get('cityId') || undefined
    const roomType = searchParams.get('roomType') || undefined
    const capacity = searchParams.get('capacity') ? parseInt(searchParams.get('capacity')!) : undefined
    const companyId = searchParams.get('companyId') || undefined
    const search = searchParams.get('search') || undefined
    const isHotel = currentUser?.role === 'HOTEL'
    const requestedStatus = searchParams.get('status') || undefined

    // Determine effective status filter:
    // - admins can filter freely or see all
    // - hotel users seeing own company rooms: no status filter (or use their requested status)
    // - public (marketplace): only APPROVED
    let effectiveStatus: string | undefined
    if (isAdmin) {
      effectiveStatus = requestedStatus
    } else if (isHotel && companyId) {
      // hotel viewing their own rooms - allow any status
      effectiveStatus = requestedStatus
    } else {
      // Public marketplace: always APPROVED
      effectiveStatus = 'APPROVED'
    }

    const where: Record<string, unknown> = { deletedAt: null }
    if (countryId) where.countryId = countryId
    if (cityId) where.cityId = cityId
    if (roomType) where.roomType = roomType
    if (capacity) where.capacity = { gte: capacity }
    if (effectiveStatus) where.status = effectiveStatus
    if (companyId) where.companyId = companyId

    // Max price filter
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const minCapacity = searchParams.get('minCapacity') ? parseInt(searchParams.get('minCapacity')!) : undefined
    if (maxPrice) where.pricePerNight = { lte: maxPrice }
    if (minCapacity) where.capacity = { gte: minCapacity }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (effectiveStatus === 'APPROVED' && !isAdmin && !isHotel) {
      where.company = {
        status: 'APPROVED',
        subscriptions: { some: { status: 'ACTIVE' } },
      }
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), isAdmin ? 500 : 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const lite = searchParams.get('lite') !== 'false'

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: lite && !isAdmin ? listInclude : fullInclude,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.room.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: serializePrisma(rooms),
      pagination: { total, limit, offset, hasMore: offset + rooms.length < total },
    })
  } catch (error) {
    console.error('Rooms GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth')
    const { db } = await import('@/lib/db')
    const { v4: uuidv4 } = await import('uuid')

    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'HOTEL') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const company = await db.getCompanyByUserId(currentUser.userId)
    if (!company) return NextResponse.json({ success: false, error: 'Hotel company not found' }, { status: 404 })
    if ((company as { status: string }).status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Hotel company not approved' }, { status: 403 })
    }

    const sub = await db.getSubscriptionByCompanyId((company as { id: string }).id)
    if (!sub || (sub as { status: string }).status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Active subscription required to add rooms' }, { status: 403 })
    }

    const existingRooms = await db.getRooms({ companyId: (company as { id: string }).id })
    if ((existingRooms as unknown[]).length >= (sub as { maxCars: number }).maxCars) {
      return NextResponse.json({ success: false, error: `Room listing limit reached (max ${(sub as { maxCars: number }).maxCars})` }, { status: 403 })
    }

    const c = company as { id: string; countryId: string; cityId: string; name: string }
    const room = await db.createRoom({
      companyId: c.id,
      countryId: c.countryId,
      cityId: c.cityId,
      name: body.name,
      roomType: body.roomType || 'STANDARD',
      pricePerNight: parseFloat(body.pricePerNight),
      capacity: parseInt(body.capacity),
      floor: body.floor,
      description: body.description,
      amenities: body.amenities || [],
      status: 'PENDING',
      images: body.images || [],
    })

    const admin = await db.getAdminUser()
    if (admin) {
      await db.createNotification({
        userId: (admin as { id: string }).id,
        type: 'GENERAL',
        title: 'New Room Submitted',
        message: `${c.name} submitted room "${(room as { name: string }).name}" for approval.`,
        isRead: false,
      })
    }

    return NextResponse.json({ success: true, data: room })
  } catch (error) {
    console.error('Room POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add room' }, { status: 500 })
  }
}

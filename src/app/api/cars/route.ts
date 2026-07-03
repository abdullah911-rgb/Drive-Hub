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
    const brand = searchParams.get('brand') || undefined
    const fuelType = searchParams.get('fuelType') || undefined
    const transmission = searchParams.get('transmission') || undefined
    const seatingCapacity = searchParams.get('seatingCapacity') ? parseInt(searchParams.get('seatingCapacity')!) : undefined
    const companyId = searchParams.get('companyId') || undefined
    const search = searchParams.get('search') || undefined
    const status = isAdmin ? (searchParams.get('status') || undefined) : 'APPROVED'

    const where: Record<string, unknown> = { deletedAt: null }
    if (countryId) where.countryId = countryId
    if (cityId) where.cityId = cityId
    if (fuelType) where.fuelType = fuelType
    if (transmission) where.transmission = transmission
    if (seatingCapacity) where.seatingCapacity = { gte: seatingCapacity }
    if (status) where.status = status
    if (companyId && isAdmin) where.companyId = companyId
    if (brand) where.brand = { contains: brand, mode: 'insensitive' }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'APPROVED') {
      where.company = {
        status: 'APPROVED',
        subscriptions: { some: { status: 'ACTIVE' } },
      }
    }

    const cars = await prisma.car.findMany({
      where,
      include: {
        images: true,
        country: true,
        city: true,
        company: {
          include: {
            country: true,
            city: true,
            subscriptions: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: serializePrisma(cars) })
  } catch (error) {
    console.error('Cars GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch cars' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth')
    const { db } = await import('@/lib/db')
    const { v4: uuidv4 } = await import('uuid')

    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'COMPANY') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const company = await db.getCompanyByUserId(currentUser.userId)
    if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
    if ((company as { status: string }).status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Company not approved' }, { status: 403 })
    }

    const sub = await db.getSubscriptionByCompanyId((company as { id: string }).id)
    if (!sub || (sub as { status: string }).status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Active subscription required to add cars' }, { status: 403 })
    }

    const existingCars = await db.getCars({ companyId: (company as { id: string }).id })
    if ((existingCars as unknown[]).length >= (sub as { maxCars: number }).maxCars) {
      return NextResponse.json({ success: false, error: `Car limit reached (max ${(sub as { maxCars: number }).maxCars})` }, { status: 403 })
    }

    const c = company as { id: string; countryId: string; cityId: string; name: string }
    const car = await db.createCar({
      companyId: c.id,
      countryId: c.countryId,
      cityId: c.cityId,
      name: `${body.brand} ${body.model} ${body.year}`,
      brand: body.brand,
      model: body.model,
      year: parseInt(body.year),
      color: body.color,
      regNumber: body.regNumber,
      engineNumber: body.engineNumber,
      mileage: parseInt(body.mileage),
      fuelType: body.fuelType,
      seatingCapacity: parseInt(body.seatingCapacity),
      transmission: body.transmission,
      description: body.description,
      features: body.features || [],
      status: 'PENDING',
      images: body.images || [],
    })

    const admin = await db.getAdminUser()
    if (admin) {
      await db.createNotification({
        userId: (admin as { id: string }).id,
        type: 'GENERAL',
        title: 'New Car Submitted',
        message: `${c.name} submitted ${(car as { name: string }).name} for approval.`,
        isRead: false,
      })
    }

    return NextResponse.json({ success: true, data: car })
  } catch (error) {
    console.error('Car POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add car' }, { status: 500 })
  }
}

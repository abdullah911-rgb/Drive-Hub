import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePrisma } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId') || undefined
    const filterType = searchParams.get('filterType') 

    const where: Record<string, unknown> = { deletedAt: null }
    if (countryId) where.countryId = countryId

    if (filterType === 'cars') {
      where.cars = {
        some: {
          status: 'APPROVED',
          deletedAt: null,
          company: {
            status: 'APPROVED',
            subscriptions: { some: { status: 'ACTIVE' } }
          }
        }
      }
    } else if (filterType === 'rooms') {
      where.rooms = {
        some: {
          status: 'APPROVED',
          deletedAt: null,
          company: {
            status: 'APPROVED',
            subscriptions: { some: { status: 'ACTIVE' } }
          }
        }
      }
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, data: serializePrisma(cities) })
  } catch (error) {
    console.error('Cities GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch cities' }, { status: 500 })
  }
}

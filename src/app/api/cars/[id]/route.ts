import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePrisma } from '@/lib/serialize'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'

    const car = await prisma.car.findUnique({
      where: { id },
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

    if (!car) return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 })

    if (car.status !== 'APPROVED' && !isAdmin) {
      if (currentUser?.role === 'COMPANY') {
        const company = await db.getCompanyByUserId(currentUser.userId)
        if ((company as { id: string } | null)?.id !== car.companyId) {
          return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ success: true, data: serializePrisma(car) })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch car' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.car.findUnique({ where: { id }, select: { companyId: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 })

    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      if (currentUser.role !== 'COMPANY') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
      const company = await db.getCompanyByUserId(currentUser.userId)
      if ((company as { id: string } | null)?.id !== existing.companyId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    }

    const body = await request.json()
    if (!isAdmin && body.status) {
      delete body.status
    }

    const car = await db.updateCar(id, body)
    return NextResponse.json({ success: true, data: car })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update car' }, { status: 500 })
  }
}

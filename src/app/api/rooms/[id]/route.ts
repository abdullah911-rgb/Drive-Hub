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

    const room = await prisma.room.findUnique({
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

    if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })

    if (room.status !== 'APPROVED' && !isAdmin) {
      if (currentUser?.role === 'HOTEL') {
        const company = await db.getCompanyByUserId(currentUser.userId)
        if ((company as { id: string } | null)?.id !== room.companyId) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ success: true, data: serializePrisma(room) })
  } catch (error) {
    console.error('Room GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch room' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.room.findUnique({ where: { id }, select: { companyId: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })

    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      if (currentUser.role !== 'HOTEL') {
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

    const room = await db.updateRoom(id, body)
    return NextResponse.json({ success: true, data: room })
  } catch (error) {
    console.error('Room PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.room.findUnique({ where: { id }, select: { companyId: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })

    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      const company = await db.getCompanyByUserId(currentUser.userId)
      if ((company as { id: string } | null)?.id !== existing.companyId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    }

    await prisma.room.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Room DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete room' }, { status: 500 })
  }
}

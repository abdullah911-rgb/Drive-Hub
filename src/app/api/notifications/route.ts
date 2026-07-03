import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const notifications = await db.getNotificationsByUserId(currentUser.userId)
    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    await db.markNotificationRead(id)
    return NextResponse.json({ success: true, data: { message: 'Marked as read' } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 500 })
  }
}

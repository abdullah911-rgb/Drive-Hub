import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Set cnicOrId to 'SKIPPED' so we know the user deliberately skipped
    await db.updateUser(currentUser.userId, { cnicOrId: 'SKIPPED' })

    return NextResponse.json({ success: true, data: { message: 'Profile skipped. You can complete it later.' } })
  } catch (error) {
    console.error('Profile skip error:', error)
    return NextResponse.json({ success: false, error: 'Failed to skip profile.' }, { status: 500 })
  }
}

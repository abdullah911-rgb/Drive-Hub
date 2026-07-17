import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { fullName, email, currentPassword, newPassword } = await request.json()

    const user = await db.getUserById(currentUser.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (fullName !== undefined) {
      updateData.fullName = fullName
    }

    if (email !== undefined) {
      if (email !== user.email) {
        const existing = await db.getUserByEmail(email)
        if (existing) {
          return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 })
        }
        updateData.email = email
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: 'Current password is required to change password' }, { status: 400 })
      }
      const valid = await verifyPassword(currentPassword, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ success: false, error: 'Incorrect current password' }, { status: 401 })
      }
      updateData.passwordHash = await hashPassword(newPassword)
    }

    const updatedUser = await db.updateUser(user.id, updateData)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ success: false, error: 'Profile update failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { encryptPassword } from '@/lib/passwordVault'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only Super Admin can create new admins' }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, email, password } = body

    if (!fullName || !email || !password) {
      return NextResponse.json({ success: false, error: 'Full name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await db.getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ success: false, error: 'This email is already registered' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const passwordEnc = encryptPassword(password)

    const newAdmin = await db.createUser({
      id: uuidv4(),
      email,
      phone: body.phone || `+1${Date.now().toString().slice(-10)}`,
      passwordHash,
      passwordEnc,
      roleName: 'ADMIN',
      status: 'APPROVED',
      emailVerified: true,
      phoneVerified: true,
      fullName,
      cnicOrId: 'ADMIN',
    })

    return NextResponse.json({
      success: true,
      data: {
        id: (newAdmin as { id: string }).id,
        email,
        fullName,
      },
    })
  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create admin account' }, { status: 500 })
  }
}

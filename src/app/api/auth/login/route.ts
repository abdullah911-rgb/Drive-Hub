import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { emailOrPhone, password } = await request.json()

    if (!emailOrPhone || !password) {
      return NextResponse.json({ success: false, error: 'Email/phone and password required' }, { status: 400 })
    }

    // Find user by email or phone
    let user = await db.getUserByEmail(emailOrPhone)
    if (!user) user = await db.getUserByPhone(emailOrPhone)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.status === 'BANNED') {
      return NextResponse.json({ success: false, error: 'Your account has been banned. Contact support.' }, { status: 403 })
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json({ success: false, error: 'Your account is suspended. Contact support.' }, { status: 403 })
    }

    if (user.status === 'REJECTED') {
      return NextResponse.json({ success: false, error: 'Your account was rejected. Contact support.' }, { status: 403 })
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.roleName,
      status: user.status,
    })

    await setAuthCookie(token)

    let companyId: string | null = null
    if (user.roleName === 'COMPANY') {
      const company = await db.getCompanyByUserId(user.id)
      companyId = company?.id || null
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.roleName,
          status: user.status,
          fullName: user.fullName,
          companyId,
        },
        redirectTo: getRedirectPath(user.roleName, user.status),
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}

function getRedirectPath(role: string, status: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return status === 'PENDING' ? '/auth?status=pending' : '/dashboard/admin'
    case 'COMPANY':
      return '/dashboard/company'
    case 'CUSTOMER':
      return status === 'PENDING' ? '/?status=pending' : '/'
    default:
      return '/'
  }
}

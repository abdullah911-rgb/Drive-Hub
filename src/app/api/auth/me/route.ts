import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const user = await db.getUserById(currentUser.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    let companyId: string | null = null
    if (user.roleName === 'COMPANY') {
      const company = await db.getCompanyByUserId(user.id)
      companyId = (company as { id: string } | null)?.id || null
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.roleName,
        roleName: user.roleName,
        status: user.status,
        fullName: user.fullName,
        cityId: user.cityId,
        countryId: user.countryId,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        companyId,
      },
    })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ success: false, error: 'Session check failed' }, { status: 500 })
  }
}

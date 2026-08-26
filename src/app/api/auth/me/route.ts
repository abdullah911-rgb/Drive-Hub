import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    // 200 + null avoids noisy 401s for anonymous visitors (Navbar/landing poll this on every page)
    if (!currentUser) {
      return NextResponse.json({ success: true, data: null })
    }

    const user = await db.getUserById(currentUser.userId)
    if (!user) {
      // Stale JWT pointing at a deleted user — treat as logged out
      return NextResponse.json({ success: true, data: null })
    }

    let companyId: string | null = null
    if (user.roleName === 'COMPANY' || user.roleName === 'HOTEL') {
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
        cnicOrId: user.cnicOrId,
        companyId,
      },
    })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ success: false, error: 'Session check failed', data: null }, { status: 500 })
  }
}

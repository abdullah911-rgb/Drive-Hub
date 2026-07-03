import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, signToken, setAuthCookie } from '@/lib/auth'
import { validateCompanyForm } from '@/lib/countryFormConfig'
import { validateLicenseNumber } from '@/lib/licenseValidation'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const user = await db.getUserById(currentUser.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (user.roleName !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Only customer accounts can register a company this way' }, { status: 403 })
    }

    if (user.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Your account must be approved before registering a company' }, { status: 403 })
    }

    const existingCompany = await db.getCompanyByUserId(user.id)
    if (existingCompany) {
      return NextResponse.json({ success: false, error: 'You already have a company registered' }, { status: 409 })
    }

    const data = await request.json()
    const {
      companyName, ownerName, cnicOrId, contactNumber, whatsAppNumber,
      businessAddress, countryId, licenseNumber,
    } = data

    if (!companyName || !ownerName || !cnicOrId || !contactNumber || !whatsAppNumber || !businessAddress || !countryId || !licenseNumber) {
      return NextResponse.json({ success: false, error: 'All company fields are required' }, { status: 400 })
    }

    const country = await db.getCountryById(countryId)
    const validation = validateCompanyForm(country?.code || 'PK', {
      cnicOrId, licenseNumber, contactNumber, whatsAppNumber, businessAddress,
    })
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 })
    }

    // Additional server-side license format check
    const licenseCheck = validateLicenseNumber(licenseNumber, country?.code || 'PK', cnicOrId)
    if (!licenseCheck.valid) {
      return NextResponse.json({ success: false, error: `Invalid license number: ${licenseCheck.error}` }, { status: 422 })
    }

    const companies = await db.getCompanies()
    if (companies.some((c: any) => c.name.toLowerCase() === companyName.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Company name already taken' }, { status: 409 })
    }

    const countryCities = await db.getCities(countryId)
    const cityId = countryCities[0]?.id || ''

    const companyId = uuidv4()
    await db.createCompany({
      id: companyId,
      userId: user.id,
      name: companyName,
      ownerName,
      cnicOrId,
      contactNumber,
      whatsAppNumber: whatsAppNumber.replace(/\D/g, ''),
      email: user.email,
      businessAddress,
      licenseNumber,
      cityId,
      countryId,
      status: 'PENDING',
    })

    await db.updateUser(user.id, {
      roleName: 'COMPANY',
      fullName: ownerName,
    })

    const adminUser = await db.getAdminUser()
    if (adminUser) {
      await db.createNotification({
        id: uuidv4(),
        userId: adminUser.id,
        type: 'GENERAL',
        title: 'Customer Registered a Company',
        message: `${user.fullName || user.email} registered "${companyName}" and is awaiting approval.`,
        isRead: false,
      })
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: 'COMPANY',
      status: user.status,
    })
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Company registration submitted. Awaiting admin approval.',
        companyId,
        redirectTo: '/dashboard/company',
      },
    })
  } catch (error) {
    console.error('Register company error:', error)
    return NextResponse.json({ success: false, error: 'Company registration failed' }, { status: 500 })
  }
}

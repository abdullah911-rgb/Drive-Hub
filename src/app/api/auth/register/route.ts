import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import {
  parseCompanyRegistrationRequest,
  saveCompanyRegistrationDocuments,
} from '@/lib/registerCompany'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      return await registerCompanyWithDocuments(request)
    }

    const body = await request.json()
    const { type, ...data } = body

    if (type === 'customer') {
      return await registerCustomer(data)
    }
    if (type === 'company') {
      return NextResponse.json({
        success: false,
        error: 'Company registration requires document uploads. Please use the registration form.',
      }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Invalid registration type' }, { status: 400 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}

async function registerCustomer(data: {
  fullName: string; fatherName: string; cnicOrId: string; dateOfBirth: string
  phone: string; email: string; address: string; countryId: string
  emergencyName: string; emergencyPhone: string; password: string
}) {
  try {
    // Basic required field check
    if (!data.email || !data.phone || !data.password || !data.fullName) {
      return NextResponse.json({ success: false, error: 'Please fill in all required fields' }, { status: 400 })
    }

    const existing = await db.getUserByEmail(data.email)
    if (existing) return NextResponse.json({ success: false, error: 'This email is already registered. Please sign in.' }, { status: 409 })

    const existingPhone = await db.getUserByPhone(data.phone)
    if (existingPhone) return NextResponse.json({ success: false, error: 'This phone number is already registered.' }, { status: 409 })

    const passwordHash = await hashPassword(data.password)

    // cityId is optional on User — pass undefined if not found (never empty string)
    let cityId: string | undefined
    if (data.countryId) {
      const countryCities = await db.getCities(data.countryId)
      const firstCity = (countryCities as { id: string }[])[0]
      cityId = firstCity?.id || undefined
    }

    await db.createUser({
      id: uuidv4(),
      email: data.email,
      phone: data.phone,
      passwordHash,
      roleName: 'CUSTOMER',
      status: 'PENDING',
      emailVerified: false,
      phoneVerified: false,
      fullName: data.fullName,
      fatherName: data.fatherName || undefined,
      cnicOrId: data.cnicOrId || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      address: data.address || undefined,
      cityId,
      countryId: data.countryId || undefined,
      emergencyName: data.emergencyName || undefined,
      emergencyPhone: data.emergencyPhone || undefined,
    })

    // Notify admin (non-blocking — don't fail registration if this errors)
    try {
      const adminUser = await db.getAdminUser()
      if (adminUser) {
        await db.createNotification({
          userId: (adminUser as { id: string }).id,
          type: 'GENERAL',
          title: 'New Customer Registration',
          message: `${data.fullName} has registered and is awaiting approval.`,
          isRead: false,
        })
      }
    } catch (notifErr) {
      console.warn('Admin notification failed (non-critical):', notifErr)
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Registration successful. Awaiting admin approval.' },
    })
  } catch (error: unknown) {
    console.error('Customer registration error:', error)
    // Surface Prisma unique constraint errors clearly
    const msg = (error as { message?: string })?.message || ''
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      if (msg.includes('email')) return NextResponse.json({ success: false, error: 'This email is already registered.' }, { status: 409 })
      if (msg.includes('phone')) return NextResponse.json({ success: false, error: 'This phone number is already registered.' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Registration failed. Please check your details and try again.' }, { status: 500 })
  }
}

async function registerCompanyWithDocuments(request: NextRequest) {
  try {
    const parsed = await parseCompanyRegistrationRequest(request, {
      requireEmail: true,
      requirePassword: true,
    })
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status })
    }

    const data = parsed.data
    const companyType = data.companyType === 'HOTEL' ? 'HOTEL' : 'CAR_RENTAL'
    const assignedRole = companyType === 'HOTEL' ? 'HOTEL' : 'COMPANY'

    // Check email uniqueness first
    const existing = await db.getUserByEmail(data.email!)
    if (existing) return NextResponse.json({ success: false, error: 'This email is already registered.' }, { status: 409 })

    // cityId is required by schema — get first city for the country
    // If no cities seeded for that country, this will fail with a clear FK error
    const countryCities = await db.getCities(data.countryId)
    const firstCity = (countryCities as { id: string }[])[0]
    if (!firstCity?.id) {
      return NextResponse.json({ success: false, error: 'No cities found for the selected country. Please contact support.' }, { status: 400 })
    }
    const cityId = firstCity.id

    const passwordHash = await hashPassword(data.password!)
    const userId = uuidv4()
    const companyId = uuidv4()

    await db.createUser({
      id: userId,
      email: data.email!,
      phone: data.contactNumber,
      passwordHash,
      roleName: assignedRole,
      status: 'PENDING',
      emailVerified: false,
      phoneVerified: false,
      fullName: data.ownerName,
    })

    await db.createCompany({
      id: companyId,
      userId,
      name: data.companyName,
      ownerName: data.ownerName,
      cnicOrId: data.cnicOrId,
      contactNumber: data.contactNumber,
      whatsAppNumber: data.whatsAppNumber.replace(/\D/g, ''),
      email: data.email!,
      businessAddress: data.businessAddress,
      licenseNumber: data.licenseNumber || 'N/A',
      cityId,
      countryId: data.countryId,
      status: 'PENDING',
      companyType,
    })

    // Save documents (non-blocking failure)
    try {
      await saveCompanyRegistrationDocuments(companyId, data.documents)
    } catch (docErr) {
      console.error('Document save error (non-critical):', docErr)
    }

    // Notify admin (non-blocking)
    try {
      const adminUser = await db.getAdminUser()
      if (adminUser) {
        await db.createNotification({
          userId: (adminUser as { id: string }).id,
          type: 'GENERAL',
          title: 'New Company Registration',
          message: `${data.companyName} has registered and is awaiting approval.`,
          isRead: false,
        })
      }
    } catch (notifErr) {
      console.warn('Admin notification failed (non-critical):', notifErr)
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Company registration submitted. Awaiting admin approval.' },
    })
  } catch (error: unknown) {
    console.error('Company registration error:', error)
    const msg = (error as { message?: string })?.message || ''
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      if (msg.includes('email')) return NextResponse.json({ success: false, error: 'This email is already registered.' }, { status: 409 })
      if (msg.includes('phone')) return NextResponse.json({ success: false, error: 'This phone number is already registered.' }, { status: 409 })
      if (msg.includes('name')) return NextResponse.json({ success: false, error: 'A company with this name already exists.' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Registration failed. Please check your details and try again.' }, { status: 500 })
  }
}

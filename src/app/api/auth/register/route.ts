import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { encryptPassword } from '@/lib/passwordVault'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ success: false, error: 'JSON body required' }, { status: 400 })
    }

    const body = await request.json()
    const { type, ...data } = body

    if (type === 'customer') {
      return await registerCustomer(data)
    }
    if (type === 'company') {
      return await registerCompany(data)
    }

    return NextResponse.json({ success: false, error: 'Invalid registration type' }, { status: 400 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}

async function registerCustomer(data: {
  fullName: string
  phone: string
  email: string
  countryId: string
  password: string
}) {
  try {
    if (!data.email || !data.phone || !data.password || !data.fullName) {
      return NextResponse.json({ success: false, error: 'Please fill in all required fields' }, { status: 400 })
    }

    const existing = await db.getUserByEmail(data.email)
    if (existing) return NextResponse.json({ success: false, error: 'This email is already registered. Please sign in.' }, { status: 409 })

    const existingPhone = await db.getUserByPhone(data.phone)
    if (existingPhone) return NextResponse.json({ success: false, error: 'This phone number is already registered.' }, { status: 409 })

    const passwordHash = await hashPassword(data.password)
    const passwordEnc = encryptPassword(data.password)

    // Resolve cityId from countryId (pick first city for that country)
    let cityId: string | undefined
    if (data.countryId) {
      const cities = await db.getCities(data.countryId) as { id: string }[]
      cityId = cities[0]?.id || undefined
    }

    await db.createUser({
      id: uuidv4(),
      email: data.email,
      phone: data.phone,
      passwordHash,
      passwordEnc,
      roleName: 'CUSTOMER',
      status: 'PENDING',
      emailVerified: false,
      phoneVerified: false,
      fullName: data.fullName,
      // Sensitive fields are deferred to /visit page
      cnicOrId: 'Pending',
      countryId: data.countryId || undefined,
      cityId,
    })

    // Notify admin
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
    const msg = (error as { message?: string })?.message || ''
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      if (msg.includes('email')) return NextResponse.json({ success: false, error: 'This email is already registered.' }, { status: 409 })
      if (msg.includes('phone')) return NextResponse.json({ success: false, error: 'This phone number is already registered.' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Registration failed. Please check your details and try again.' }, { status: 500 })
  }
}

async function registerCompany(data: {
  companyName: string
  ownerName: string
  contactNumber: string
  email: string
  countryId: string
  password: string
  companyType?: string
}) {
  try {
    if (!data.email || !data.contactNumber || !data.password || !data.companyName || !data.ownerName) {
      return NextResponse.json({ success: false, error: 'Please fill in all required fields' }, { status: 400 })
    }

    if (!data.countryId) {
      return NextResponse.json({ success: false, error: 'Country selection is required.' }, { status: 400 })
    }

    const existing = await db.getUserByEmail(data.email)
    if (existing) return NextResponse.json({ success: false, error: 'This email is already registered.' }, { status: 409 })

    const existingPhone = await db.getUserByPhone(data.contactNumber)
    if (existingPhone) return NextResponse.json({ success: false, error: 'This phone number is already registered.' }, { status: 409 })

    const companyType = data.companyType === 'HOTEL' ? 'HOTEL' : 'CAR_RENTAL'
    const assignedRole = companyType === 'HOTEL' ? 'HOTEL' : 'COMPANY'

    // Resolve city (use first city for given country, or first global city as fallback)
    let cityId: string | undefined
    if (data.countryId) {
      const cities = await db.getCities(data.countryId) as { id: string }[]
      cityId = cities[0]?.id
    }
    if (!cityId) {
      // fallback: any city
      const allCities = await db.getCities('') as { id: string }[]
      cityId = allCities[0]?.id
    }
    if (!cityId) {
      return NextResponse.json({ success: false, error: 'No cities found for the selected country. Please contact support.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(data.password)
    const passwordEnc = encryptPassword(data.password)
    const userId = uuidv4()
    const companyId = uuidv4()

    await db.createUser({
      id: userId,
      email: data.email,
      phone: data.contactNumber,
      passwordHash,
      passwordEnc,
      roleName: assignedRole,
      status: 'PENDING',
      emailVerified: false,
      phoneVerified: false,
      fullName: data.ownerName,
      cnicOrId: 'Pending',
      countryId: data.countryId,
      cityId,
    })

    await db.createCompany({
      id: companyId,
      userId,
      name: data.companyName,
      ownerName: data.ownerName,
      cnicOrId: 'Pending',
      contactNumber: data.contactNumber,
      whatsAppNumber: data.contactNumber.replace(/\D/g, ''),
      email: data.email,
      businessAddress: 'Pending',
      licenseNumber: 'Pending',
      cityId,
      countryId: data.countryId,
      status: 'PENDING',
      companyType,
    })

    // Notify admin
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

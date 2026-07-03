import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { validateCompanyForm } from '@/lib/countryFormConfig'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (type === 'customer') {
      return await registerCustomer(data)
    } else if (type === 'company') {
      return await registerCompany(data)
    }

    return NextResponse.json({ success: false, error: 'Invalid registration type' }, { status: 400 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 })
  }
}

async function registerCustomer(data: {
  fullName: string; fatherName: string; cnicOrId: string; dateOfBirth: string
  phone: string; email: string; address: string; countryId: string
  emergencyName: string; emergencyPhone: string; password: string
}) {
  const existing = await db.getUserByEmail(data.email)
  if (existing) return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 })

  const existingPhone = await db.getUserByPhone(data.phone)
  if (existingPhone) return NextResponse.json({ success: false, error: 'Phone already registered' }, { status: 409 })

  const passwordHash = await hashPassword(data.password)
  const countryCities = await db.getCities(data.countryId)
  const cityId = (countryCities as { id: string }[])[0]?.id

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
    fatherName: data.fatherName,
    cnicOrId: data.cnicOrId,
    dateOfBirth: data.dateOfBirth,
    address: data.address,
    cityId,
    countryId: data.countryId,
    emergencyName: data.emergencyName,
    emergencyPhone: data.emergencyPhone,
  })

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

  return NextResponse.json({
    success: true,
    data: { message: 'Registration successful. Awaiting admin approval.' },
  })
}

async function registerCompany(data: {
  companyName: string; ownerName: string; cnicOrId: string; contactNumber: string
  whatsAppNumber: string; email: string; businessAddress: string;
  countryId: string; licenseNumber: string; password: string
}) {
  const existing = await db.getUserByEmail(data.email)
  if (existing) return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 })

  const country = await db.getCountryById(data.countryId) as { code: string } | null
  const validation = validateCompanyForm(country?.code || 'PK', {
    cnicOrId: data.cnicOrId,
    licenseNumber: data.licenseNumber,
    contactNumber: data.contactNumber,
    whatsAppNumber: data.whatsAppNumber,
    businessAddress: data.businessAddress,
  })
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.message }, { status: 400 })
  }

  const passwordHash = await hashPassword(data.password)
  const userId = uuidv4()
  const countryCities = await db.getCities(data.countryId)
  const cityId = (countryCities as { id: string }[])[0]?.id || ''

  await db.createUser({
    id: userId,
    email: data.email,
    phone: data.contactNumber,
    passwordHash,
    roleName: 'COMPANY',
    status: 'PENDING',
    emailVerified: false,
    phoneVerified: false,
    fullName: data.ownerName,
  })

  await db.createCompany({
    id: uuidv4(),
    userId,
    name: data.companyName,
    ownerName: data.ownerName,
    cnicOrId: data.cnicOrId,
    contactNumber: data.contactNumber,
    whatsAppNumber: data.whatsAppNumber.replace(/\D/g, ''),
    email: data.email,
    businessAddress: data.businessAddress,
    licenseNumber: data.licenseNumber,
    cityId,
    countryId: data.countryId,
    status: 'PENDING',
  })

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

  return NextResponse.json({
    success: true,
    data: { message: 'Company registration submitted. Awaiting admin approval.' },
  })
}

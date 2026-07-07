import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { validateCompanyForm } from '@/lib/countryFormConfig'
import { validateLicenseNumber } from '@/lib/licenseValidation'
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
        error: 'Company registration requires CNIC and license document uploads. Please use the updated registration form.',
      }, { status: 400 })
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

async function registerCompanyWithDocuments(request: NextRequest) {
  const parsed = await parseCompanyRegistrationRequest(request, {
    requireEmail: true,
    requirePassword: true,
  })
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status })
  }

  const data = parsed.data
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

  const licenseCheck = validateLicenseNumber(
    data.licenseNumber,
    country?.code || 'PK',
    data.cnicOrId
  )
  if (!licenseCheck.valid) {
    return NextResponse.json({ success: false, error: `Invalid license number: ${licenseCheck.error}` }, { status: 422 })
  }

  const existing = await db.getUserByEmail(data.email!)
  if (existing) return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 })

  const passwordHash = await hashPassword(data.password!)
  const userId = uuidv4()
  const countryCities = await db.getCities(data.countryId)
  const cityId = (countryCities as { id: string }[])[0]?.id || ''
  const companyId = uuidv4()

  await db.createUser({
    id: userId,
    email: data.email!,
    phone: data.contactNumber,
    passwordHash,
    roleName: 'COMPANY',
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
    licenseNumber: data.licenseNumber,
    cityId,
    countryId: data.countryId,
    status: 'PENDING',
  })

  await saveCompanyRegistrationDocuments(companyId, data.documents)

  const adminUser = await db.getAdminUser()
  if (adminUser) {
    await db.createNotification({
      userId: (adminUser as { id: string }).id,
      type: 'GENERAL',
      title: 'New Company Registration',
      message: `${data.companyName} has registered with verification documents and is awaiting approval.`,
      isRead: false,
    })
  }

  return NextResponse.json({
    success: true,
    data: { message: 'Company registration submitted. Awaiting admin approval.' },
  })
}

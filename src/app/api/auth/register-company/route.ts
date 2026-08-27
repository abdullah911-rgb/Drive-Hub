import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, signToken, setAuthCookie } from '@/lib/auth'
import {
  parseCompanyRegistrationRequest,
  saveCompanyRegistrationDocuments,
} from '@/lib/registerCompany'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'

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

    const parsed = await parseCompanyRegistrationRequest(request)
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status })
    }

    const {
      companyName, ownerName, cnicOrId, contactNumber, whatsAppNumber,
      businessAddress, countryId, licenseNumber, documents, companyType: rawType,
    } = parsed.data

    const companyType = rawType === 'HOTEL' ? 'HOTEL' : 'CAR_RENTAL'
    const assignedRole = companyType === 'HOTEL' ? 'HOTEL' : 'COMPANY'

    const companies = await db.getCompanies()
    if (companies.some((c: { name: string }) => c.name.toLowerCase() === companyName.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'A company with this name already exists. Please choose a different name.' }, { status: 409 })
    }

    const countryCities = await db.getCities(countryId)
    const firstCity = (countryCities as { id: string }[])[0]
    if (!firstCity?.id) {
      return NextResponse.json({ success: false, error: 'No cities found for the selected country. Please contact support.' }, { status: 400 })
    }
    const cityId = firstCity.id

    const companyId = uuidv4()
    await prisma.company.create({
      data: {
        id: companyId,
        userId: user.id,
        name: companyName,
        ownerName,
        cnicOrId,
        contactNumber,
        whatsAppNumber: whatsAppNumber.replace(/\D/g, ''),
        email: user.email,
        businessAddress,
        licenseNumber: licenseNumber || 'N/A',
        cityId,
        countryId,
        status: 'PENDING',
        companyType: companyType as 'CAR_RENTAL' | 'HOTEL',
      },
    })

    try {
      await saveCompanyRegistrationDocuments(companyId, documents)
    } catch (docErr) {
      console.error('Document save error (non-critical):', docErr)
    }

    await db.updateUser(user.id, {
      roleName: assignedRole,
      fullName: ownerName,
    })

    try {
      const adminUser = await db.getAdminUser()
      if (adminUser) {
        await db.createNotification({
          id: uuidv4(),
          userId: adminUser.id,
          type: 'GENERAL',
          title: `Customer Registered a ${companyType === 'HOTEL' ? 'Hotel' : 'Company'}`,
          message: `${user.fullName || user.email} registered "${companyName}" and is awaiting approval.`,
          isRead: false,
        })
      }
    } catch (notifErr) {
      console.warn('Admin notification failed (non-critical):', notifErr)
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: assignedRole,
      status: user.status,
    })
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      data: {
        message: `${companyType === 'HOTEL' ? 'Hotel' : 'Company'} registration submitted. Awaiting admin approval.`,
        companyId,
        redirectTo: companyType === 'HOTEL' ? '/dashboard/hotel' : '/dashboard/company',
      },
    })
  } catch (error: unknown) {
    console.error('Register company error:', error)
    const msg = (error as { message?: string })?.message || ''
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      if (msg.includes('name')) return NextResponse.json({ success: false, error: 'A company with this name already exists.' }, { status: 409 })
      if (msg.includes('email')) return NextResponse.json({ success: false, error: 'This email is already registered.' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Company registration failed. Please try again.' }, { status: 500 })
  }
}

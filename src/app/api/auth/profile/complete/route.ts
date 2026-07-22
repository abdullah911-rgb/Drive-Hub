import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { saveCompanyDocument } from '@/lib/uploads'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const userType = formData.get('userType') as string

    if (userType === 'CUSTOMER') {
      // Update customer-specific fields
      const fatherName = (formData.get('fatherName') as string)?.trim()
      const cnicOrId = (formData.get('cnicOrId') as string)?.trim()
      const dateOfBirth = (formData.get('dateOfBirth') as string)?.trim()
      const address = (formData.get('address') as string)?.trim()
      const countryId = (formData.get('countryId') as string)?.trim()
      const emergencyName = (formData.get('emergencyName') as string)?.trim()
      const emergencyPhone = (formData.get('emergencyPhone') as string)?.trim()

      if (!fatherName || !cnicOrId || !dateOfBirth || !address || !countryId || !emergencyName || !emergencyPhone) {
        return NextResponse.json({ success: false, error: 'All customer fields are required' }, { status: 400 })
      }

      // Resolve cityId from countryId
      const cities = await db.getCities(countryId) as { id: string }[]
      const cityId = cities[0]?.id

      await db.updateUser(currentUser.userId, {
        fatherName,
        cnicOrId,
        dateOfBirth,
        address,
        countryId,
        cityId,
        emergencyName,
        emergencyPhone,
        status: 'PENDING', // back to pending for admin re-verification
      })

      // Notify admin
      try {
        const adminUser = await db.getAdminUser()
        if (adminUser) {
          await db.createNotification({
            userId: (adminUser as { id: string }).id,
            type: 'GENERAL',
            title: 'Customer Profile Submitted',
            message: `A customer has submitted their verification profile and awaits review.`,
            isRead: false,
          })
        }
      } catch { /* non-critical */ }

      return NextResponse.json({ success: true, data: { message: 'Profile submitted for review.' } })

    } else if (userType === 'COMPANY' || userType === 'HOTEL') {
      // Update company-specific fields
      const ownerName = (formData.get('ownerName') as string)?.trim()
      const cnicOrId = (formData.get('cnicOrId') as string)?.trim()
      const licenseNumber = (formData.get('licenseNumber') as string)?.trim()
      const businessAddress = (formData.get('businessAddress') as string)?.trim()
      const whatsAppNumber = (formData.get('whatsAppNumber') as string)?.trim()
      const countryId = (formData.get('countryId') as string)?.trim()
      const licenseFile = formData.get('licenseDocument') as File | null
      const cnicFront = formData.get('cnicFront') as File | null
      const cnicBack = formData.get('cnicBack') as File | null

      if (!ownerName || !cnicOrId || !licenseNumber || !businessAddress || !whatsAppNumber || !countryId) {
        return NextResponse.json({ success: false, error: 'All company fields are required' }, { status: 400 })
      }
      if (!licenseFile || !cnicFront || !cnicBack) {
        return NextResponse.json({ success: false, error: 'All three documents are required' }, { status: 400 })
      }

      // Get company associated with this user
      const user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: { company: true },
      })
      if (!user?.company) {
        return NextResponse.json({ success: false, error: 'No company found for this user' }, { status: 404 })
      }
      const companyId = user.company.id

      // Update user cnicOrId
      await db.updateUser(currentUser.userId, { cnicOrId, status: 'PENDING' })

      // Update company fields
      await db.updateCompany(companyId, {
        ownerName,
        cnicOrId,
        licenseNumber,
        businessAddress,
        whatsAppNumber: whatsAppNumber.replace(/\D/g, ''),
        countryId,
        status: 'PENDING',
      })

      // Save uploaded documents
      try {
        const documents: { id: string; companyId: string; docType: string; fileUrl: string }[] = []
        const docSaves = [
          { file: licenseFile, docType: 'LICENSE_FRONT' as const },
          { file: cnicFront, docType: 'CNIC_FRONT' as const },
          { file: cnicBack, docType: 'CNIC_BACK' as const },
        ]
        for (const { file, docType } of docSaves) {
          if (!file || file.size === 0) continue
          try {
            // Use saveCompanyDocument for proper saving
            const fileUrl = await saveCompanyDocument(companyId, docType, file)
            documents.push({ id: uuidv4(), companyId, docType, fileUrl })
          } catch (docErr) {
            console.error(`Error saving document ${docType}:`, docErr)
          }
        }
        if (documents.length > 0) {
          await db.createCompanyDocuments(documents)
        }
      } catch (docErr) {
        console.error('Document save error (non-critical):', docErr)
      }

      // Notify admin
      try {
        const adminUser = await db.getAdminUser()
        if (adminUser) {
          await db.createNotification({
            userId: (adminUser as { id: string }).id,
            type: 'GENERAL',
            title: 'Company Profile Submitted',
            message: `${user.company.name} has submitted their verification documents and awaits review.`,
            isRead: false,
          })
        }
      } catch { /* non-critical */ }

      return NextResponse.json({ success: true, data: { message: 'Company profile submitted for review.' } })
    }

    return NextResponse.json({ success: false, error: 'Invalid user type' }, { status: 400 })
  } catch (error) {
    console.error('Profile complete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit profile.' }, { status: 500 })
  }
}

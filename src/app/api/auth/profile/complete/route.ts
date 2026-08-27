import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { saveCompanyDocument } from '@/lib/uploads'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

function asUploadFile(entry: FormDataEntryValue | null): File | null {
  if (!entry || typeof entry === 'string') return null
  const file = entry as File
  if (typeof file.arrayBuffer !== 'function' || typeof file.size !== 'number') return null
  if (!file.size) return null
  return file
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const userType = formData.get('userType') as string

    if (userType === 'CUSTOMER') {
      
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
        status: 'PENDING', 
      })

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
      } catch {  }

      return NextResponse.json({ success: true, data: { message: 'Profile submitted for review.' } })

    } else if (userType === 'COMPANY' || userType === 'HOTEL') {
      
      const ownerName = (formData.get('ownerName') as string)?.trim()
      const cnicOrId = (formData.get('cnicOrId') as string)?.trim()
      const licenseNumber = (formData.get('licenseNumber') as string)?.trim()
      const businessAddress = (formData.get('businessAddress') as string)?.trim()
      const whatsAppNumber = (formData.get('whatsAppNumber') as string)?.trim()
      const countryId = (formData.get('countryId') as string)?.trim()
      if (!ownerName || !cnicOrId || !licenseNumber || !businessAddress || !whatsAppNumber || !countryId) {
        return NextResponse.json({ success: false, error: 'All company fields are required' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: { company: true },
      })
      if (!user?.company) {
        return NextResponse.json({ success: false, error: 'No company found for this user' }, { status: 404 })
      }
      const companyId = user.company.id

      await db.updateUser(currentUser.userId, { cnicOrId, status: 'PENDING' })

      await db.updateCompany(companyId, {
        ownerName,
        cnicOrId,
        licenseNumber,
        businessAddress,
        whatsAppNumber: whatsAppNumber.replace(/\D/g, ''),
        countryId,
        status: 'PENDING',
      })

      const documents: { id: string; companyId: string; docType: string; fileUrl: string }[] = []
      const docSaves: { entry: FormDataEntryValue | null; docType: 'LICENSE_FRONT' | 'CNIC_FRONT' | 'CNIC_BACK' }[] = [
        { entry: formData.get('licenseDocument') ?? formData.get('LICENSE_FRONT'), docType: 'LICENSE_FRONT' },
        { entry: formData.get('cnicFront') ?? formData.get('CNIC_FRONT'), docType: 'CNIC_FRONT' },
        { entry: formData.get('cnicBack') ?? formData.get('CNIC_BACK'), docType: 'CNIC_BACK' },
      ]

      const saveErrors: string[] = []
      for (const { entry, docType } of docSaves) {
        const file = asUploadFile(entry)
        if (!file) continue
        try {
          const fileUrl = await saveCompanyDocument(companyId, docType, file)
          documents.push({ id: uuidv4(), companyId, docType, fileUrl })
        } catch (docErr) {
          const message = docErr instanceof Error ? docErr.message : `Failed to save ${docType}`
          console.error(`Error saving document ${docType}:`, docErr)
          saveErrors.push(message)
        }
      }

      if (saveErrors.length > 0) {
        return NextResponse.json(
          { success: false, error: saveErrors[0] || 'Failed to save verification documents.' },
          { status: 400 }
        )
      }

      if (documents.length > 0) {
        
        const types = documents.map((d) => d.docType)
        await prisma.companyDocument.updateMany({
          where: { companyId, docType: { in: types }, deletedAt: null },
          data: { deletedAt: new Date() },
        })
        await db.createCompanyDocuments(documents)
      }

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
      } catch {  }

      return NextResponse.json({ success: true, data: { message: 'Company profile submitted for review.' } })
    }

    return NextResponse.json({ success: false, error: 'Invalid user type' }, { status: 400 })
  } catch (error) {
    console.error('Profile complete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit profile.' }, { status: 500 })
  }
}

import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { COMPANY_DOC_TYPES, type CompanyDocType, validateCompanyDocumentFile } from '@/lib/companyDocuments'
import { saveCompanyDocument } from '@/lib/uploads'
import { db } from '@/lib/db'

export interface ParsedCompanyRegistration {
  companyName: string
  ownerName: string
  cnicOrId: string
  contactNumber: string
  whatsAppNumber: string
  businessAddress: string
  countryId: string
  licenseNumber: string
  email?: string
  password?: string
  companyType?: string
  documents: Partial<Record<CompanyDocType, File>>
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export async function parseCompanyRegistrationRequest(
  request: NextRequest,
  options?: { requireEmail?: boolean; requirePassword?: boolean }
): Promise<{ ok: true; data: ParsedCompanyRegistration } | { ok: false; error: string; status: number }> {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return {
      ok: false,
      error: 'Company registration requires document uploads. Please submit the form with all required files.',
      status: 400,
    }
  }

  const formData = await request.formData()
  const companyName = getFormString(formData, 'companyName')
  const ownerName = getFormString(formData, 'ownerName')
  const cnicOrId = getFormString(formData, 'cnicOrId')
  const contactNumber = getFormString(formData, 'contactNumber')
  const whatsAppNumber = getFormString(formData, 'whatsAppNumber')
  const businessAddress = getFormString(formData, 'businessAddress')
  const countryId = getFormString(formData, 'countryId')
  const companyType = getFormString(formData, 'companyType') || 'CAR_RENTAL'
  const isHotel = companyType === 'HOTEL'
  const licenseNumber = isHotel ? (getFormString(formData, 'licenseNumber') || 'N/A') : getFormString(formData, 'licenseNumber')
  const email = getFormString(formData, 'email')
  const password = getFormString(formData, 'password')

  if (
    !companyName || !ownerName || !cnicOrId || !contactNumber || !whatsAppNumber
    || !businessAddress || !countryId || (!isHotel && !licenseNumber)
  ) {
    return { ok: false, error: 'All company fields are required', status: 400 }
  }

  if (options?.requireEmail && !email) {
    return { ok: false, error: 'Email is required', status: 400 }
  }

  if (options?.requirePassword && !password) {
    return { ok: false, error: 'Password is required', status: 400 }
  }

  const documents: Partial<Record<CompanyDocType, File>> = {}
  for (const docType of COMPANY_DOC_TYPES) {
    if (isHotel && (docType === 'LICENSE_FRONT' || docType === 'LICENSE_BACK')) {
      continue
    }
    const entry = formData.get(docType)
    const file =
      entry && typeof entry !== 'string' && typeof (entry as File).arrayBuffer === 'function' && (entry as File).size > 0
        ? (entry as File)
        : null
    if (!file) {
      return { ok: false, error: `Missing required document: ${docType}`, status: 400 }
    }
    const check = validateCompanyDocumentFile(file)
    if (!check.valid) {
      return { ok: false, error: check.error || 'Invalid document file', status: 400 }
    }
    documents[docType] = file
  }

  return {
    ok: true,
    data: {
      companyName,
      ownerName,
      cnicOrId,
      contactNumber,
      whatsAppNumber,
      businessAddress,
      countryId,
      licenseNumber,
      email: email || undefined,
      password: password || undefined,
      companyType,
      documents,
    },
  }
}

export async function saveCompanyRegistrationDocuments(
  companyId: string,
  documents: Partial<Record<CompanyDocType, File>>
) {
  const records = []
  for (const docType of Object.keys(documents) as CompanyDocType[]) {
    const file = documents[docType]
    if (!file) continue
    const fileUrl = await saveCompanyDocument(companyId, docType, file)
    records.push({
      id: uuidv4(),
      companyId,
      docType,
      fileUrl,
    })
  }
  await db.createCompanyDocuments(records)
  return records
}

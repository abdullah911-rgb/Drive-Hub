export const COMPANY_DOC_TYPES = [
  'CNIC_FRONT',
  'CNIC_BACK',
  'LICENSE_FRONT',
  'LICENSE_BACK',
] as const

export type CompanyDocType = (typeof COMPANY_DOC_TYPES)[number]

export const COMPANY_DOC_LABELS: Record<CompanyDocType, string> = {
  CNIC_FRONT: 'ID / CNIC — Front',
  CNIC_BACK: 'ID / CNIC — Back',
  LICENSE_FRONT: 'Business License — Front',
  LICENSE_BACK: 'Business License — Back',
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

const MAX_FILE_SIZE = 5 * 1024 * 1024

export function validateCompanyDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, WebP, or PDF files are allowed.' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Each file must be 5 MB or smaller.' }
  }
  return { valid: true }
}

export function validateCompanyDocuments(
  docs: Partial<Record<CompanyDocType, File | null>>,
  isHotel?: boolean
): { valid: boolean; error?: string } {
  for (const docType of COMPANY_DOC_TYPES) {
    if (isHotel && (docType === 'LICENSE_FRONT' || docType === 'LICENSE_BACK')) {
      continue
    }
    const file = docs[docType]
    if (!file) {
      return { valid: false, error: `${COMPANY_DOC_LABELS[docType]} is required.` }
    }
    const check = validateCompanyDocumentFile(file)
    if (!check.valid) return check
  }
  return { valid: true }
}

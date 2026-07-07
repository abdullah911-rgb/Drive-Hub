import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import type { CompanyDocType } from '@/lib/companyDocuments'
import { validateCompanyDocumentFile } from '@/lib/companyDocuments'

export async function saveCompanyDocument(
  companyId: string,
  docType: CompanyDocType,
  file: File
): Promise<string> {
  const validation = validateCompanyDocumentFile(file)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid document file')
  }

  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase()
    : file.type === 'application/pdf'
      ? 'pdf'
      : 'jpg'

  const dir = path.join(process.cwd(), 'public', 'uploads', 'companies', companyId)
  await mkdir(dir, { recursive: true })

  const filename = `${docType.toLowerCase()}.${ext}`
  const filepath = path.join(dir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return `/uploads/companies/${companyId}/${filename}`
}

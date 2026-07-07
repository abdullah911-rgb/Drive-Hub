'use client'
import { useRef } from 'react'
import {
  COMPANY_DOC_TYPES,
  COMPANY_DOC_LABELS,
  type CompanyDocType,
  validateCompanyDocumentFile,
} from '@/lib/companyDocuments'

export type CompanyDocumentFiles = Record<CompanyDocType, File | null>

export const EMPTY_COMPANY_DOCUMENTS: CompanyDocumentFiles = {
  CNIC_FRONT: null,
  CNIC_BACK: null,
  LICENSE_FRONT: null,
  LICENSE_BACK: null,
}

interface CompanyDocumentUploadsProps {
  documents: CompanyDocumentFiles
  onChange: (docType: CompanyDocType, file: File | null) => void
  idLabel?: string
  licenseLabel?: string
}

const labelClass = 'text-xs font-medium text-slate-400 mb-1 block'

export default function CompanyDocumentUploads({
  documents,
  onChange,
  idLabel = 'National ID / CNIC',
  licenseLabel = 'Business License',
}: CompanyDocumentUploadsProps) {
  const inputRefs = useRef<Partial<Record<CompanyDocType, HTMLInputElement | null>>>({})

  const getDisplayLabel = (docType: CompanyDocType) => {
    if (docType.startsWith('CNIC')) {
      const side = docType === 'CNIC_FRONT' ? 'Front' : 'Back'
      return `${idLabel} — ${side}`
    }
    const side = docType === 'LICENSE_FRONT' ? 'Front' : 'Back'
    return `${licenseLabel} — ${side}`
  }

  const handleFileChange = (docType: CompanyDocType, file: File | null) => {
    if (!file) {
      onChange(docType, null)
      return
    }
    const check = validateCompanyDocumentFile(file)
    if (!check.valid) {
      alert(check.error)
      if (inputRefs.current[docType]) inputRefs.current[docType]!.value = ''
      return
    }
    onChange(docType, file)
  }

  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-3 border border-primary/20 bg-primary/5">
        <p className="text-xs font-semibold text-white">Verification Documents *</p>
        <p className="text-[10px] text-slate-400 mt-1">
          Upload clear photos or scans of both sides of your ID and business license (JPG, PNG, WebP, or PDF, max 5 MB each).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {COMPANY_DOC_TYPES.map(docType => {
          const file = documents[docType]
          return (
            <div key={docType}>
              <label className={labelClass}>{getDisplayLabel(docType)} *</label>
              <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-white/15 rounded-xl p-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors min-h-[88px]">
                <input
                  ref={el => { inputRefs.current[docType] = el }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => handleFileChange(docType, e.target.files?.[0] || null)}
                />
                {file ? (
                  <>
                    <span className="text-lg">✅</span>
                    <span className="text-[10px] text-emerald-400 text-center line-clamp-2 break-all px-1">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      className="text-[10px] text-red-400 hover:text-red-300"
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (inputRefs.current[docType]) inputRefs.current[docType]!.value = ''
                        onChange(docType, null)
                      }}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg text-slate-500">📄</span>
                    <span className="text-[10px] text-slate-500 text-center">
                      {COMPANY_DOC_LABELS[docType]}
                    </span>
                  </>
                )}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function appendCompanyDocumentsToFormData(
  formData: FormData,
  documents: CompanyDocumentFiles
) {
  for (const docType of COMPANY_DOC_TYPES) {
    const file = documents[docType]
    if (file) formData.append(docType, file)
  }
}

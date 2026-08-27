'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import CompanyFormFields, { type CompanyFormValues } from '@/components/shared/CompanyFormFields'
import CompanyDocumentUploads, {
  EMPTY_COMPANY_DOCUMENTS,
  appendCompanyDocumentsToFormData,
  type CompanyDocumentFiles,
} from '@/components/shared/CompanyDocumentUploads'
import { validateCompanyForm } from '@/lib/countryFormConfig'
import { validateCompanyDocuments } from '@/lib/companyDocuments'

interface RegisterCompanyModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultCountryId?: string
}

const EMPTY_FORM: CompanyFormValues = {
  companyName: '',
  ownerName: '',
  cnicOrId: '',
  contactNumber: '',
  whatsAppNumber: '',
  businessAddress: '',
  countryId: '',
  licenseNumber: '',
}

export default function RegisterCompanyModal({
  open,
  onClose,
  onSuccess,
  defaultCountryId = '',
}: RegisterCompanyModalProps) {
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [form, setForm] = useState<CompanyFormValues>({ ...EMPTY_FORM, countryId: defaultCountryId })
  const [documents, setDocuments] = useState<CompanyDocumentFiles>({ ...EMPTY_COMPANY_DOCUMENTS })
  const [companyType, setCompanyType] = useState<'CAR_RENTAL' | 'HOTEL'>('CAR_RENTAL')

  useEffect(() => {
    if (!open) return
    fetch('/api/countries')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCountries(data.data)
          setForm(prev => ({
            ...EMPTY_FORM,
            countryId: defaultCountryId || prev.countryId || data.data[0]?.id || '',
          }))
          setDocuments({ ...EMPTY_COMPANY_DOCUMENTS })
          setCompanyType('CAR_RENTAL')
        }
      })
      .catch(() => toast.error('Failed to load countries'))
  }, [open, defaultCountryId])

  const handleChange = useCallback((updates: Partial<CompanyFormValues>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }, [])

  const handleDocumentChange = useCallback((docType: keyof CompanyDocumentFiles, file: File | null) => {
    setDocuments(prev => ({ ...prev, [docType]: file }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const country = countries.find(c => c.id === form.countryId)
    const validation = validateCompanyForm(country?.code || 'PK', form, companyType === 'HOTEL')
    if (!validation.valid) {
      toast.error(validation.message || 'Please check your form fields')
      return
    }

    const docValidation = validateCompanyDocuments(documents, companyType === 'HOTEL')
    if (!docValidation.valid) {
      toast.error(docValidation.error || 'Please upload all required documents')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      formData.append('companyType', companyType)
      appendCompanyDocumentsToFormData(formData, documents)

      const res = await fetch('/api/auth/register-company', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${companyType === 'HOTEL' ? 'Hotel' : 'Company'} registration submitted! Awaiting admin approval.`)
        onClose()
        onSuccess?.()
        if (data.data?.redirectTo) {
          window.location.href = data.data.redirectTo
        }
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const countryConfig = countries.find(c => c.id === form.countryId)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass-card no-card-hover w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-border shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-heading font-bold text-xl text-white">Register Your Business</h2>
                <p className="text-slate-400 text-sm mt-1">
                  List your fleet or hotel on our marketplace. Select your business type below.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-icon p-2 rounded-lg text-slate-400"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {}
            <div className="flex gap-3 mb-5">
              {[
                { type: 'CAR_RENTAL' as const, icon: '🚗', label: 'Car Rental', desc: 'List vehicles for rent' },
                { type: 'HOTEL' as const, icon: '🏨', label: 'Hotel', desc: 'List rooms & accommodation' },
              ].map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setCompanyType(opt.type)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                    companyType === opt.type
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="font-bold">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <CompanyFormFields
                form={form}
                onChange={handleChange}
                countries={countries}
                countryPosition="top"
                showDocumentHint={false}
                companyType={companyType}
              />

              <CompanyDocumentUploads
                documents={documents}
                onChange={handleDocumentChange}
                idLabel={countryConfig?.code === 'PK' ? 'CNIC' : 'National ID'}
                licenseLabel={companyType === 'HOTEL' ? 'Hotel License' : 'Business License'}
                companyType={companyType}
              />

              <div className="glass rounded-xl p-3 text-xs text-amber-400 border border-amber-400/20">
                After admin approval you will get access to the {companyType === 'HOTEL' ? 'hotel' : 'company'} panel to manage listings and subscriptions.
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 font-bold">
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  `Submit ${companyType === 'HOTEL' ? 'Hotel' : 'Company'} Registration`
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'
import { getFlagEmoji } from '@/lib/utils'
import Image from 'next/image'
import { validateCompanyDocumentFile } from '@/lib/companyDocuments'

interface Country { id: string; name: string; code: string; currency: string; dialCode: string }

function VisitContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [userRole, setUserRole] = useState<'CUSTOMER' | 'COMPANY' | 'HOTEL' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [countries, setCountries] = useState<Country[]>([])

  // Customer fields
  const [custForm, setCustForm] = useState({
    fatherName: '', cnicOrId: '', dateOfBirth: '', address: '',
    countryId: '', emergencyName: '', emergencyPhone: '',
  })

  // Company fields
  const [compForm, setCompForm] = useState({
    ownerName: '', cnicOrId: '', licenseNumber: '', businessAddress: '',
    whatsAppNumber: '', countryId: '',
  })

  // Document files
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null)
  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null)

  const getPhonePlaceholder = (countryId: string) => {
    const c = countries.find(x => x.id === countryId)
    return c ? `${c.dialCode} 123 456789` : "+92 300 0000000"
  }

  const getIdPlaceholder = (countryId: string) => {
    const c = countries.find(x => x.id === countryId)
    if (c?.code === 'PK') return "35201-1234567-1"
    if (c?.code === 'SA') return "10xxxxxxxx"
    return "ID Card or Passport Number"
  }

  const getLicenseLabel = (countryId: string) => {
    const c = countries.find(x => x.id === countryId)
    if (c?.code === 'SA') return "Commercial Registration (CR) Number *"
    return "Business / License Number *"
  }

  const getLicensePlaceholder = (countryId: string) => {
    const c = countries.find(x => x.id === countryId)
    if (c?.code === 'SA') return "10xxxxxxxx"
    return "License or registration number"
  }

  useEffect(() => {
    async function init() {
      try {
        // Verify user is authenticated and approved
        const meRes = await fetch('/api/auth/me', { credentials: 'include' })
        if (!meRes.ok) { router.push('/auth'); return }
        const meData = await meRes.json()
        const user = meData.data
        if (!user) { router.push('/auth'); return }

        // If already completed profile (cnicOrId not 'Pending'), redirect to panel
        if (user.cnicOrId && user.cnicOrId !== 'Pending' && user.cnicOrId !== 'SKIPPED') {
          redirectToPanel(user.roleName)
          return
        }

        setUserRole(user.roleName)
        setUserId(user.id)

        const countryRes = await fetch('/api/countries')
        const countryData = await countryRes.json()
        if (countryData.success) setCountries(countryData.data)
      } catch {
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const redirectToPanel = (role: string) => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/dashboard/admin')
    else if (role === 'COMPANY') router.push('/dashboard/company')
    else if (role === 'HOTEL') router.push('/dashboard/hotel')
    else router.push('/')
  }

  const handleSkip = async () => {
    setSkipping(true)
    try {
      const res = await fetch('/api/auth/profile/skip', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('You can complete your profile later from the dashboard.')
        redirectToPanel(userRole!)
      } else {
        toast.error(data.error || 'Failed to skip. Please try again.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSkipping(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formData = new FormData()

      if (userRole === 'CUSTOMER') {
        if (!custForm.fatherName || !custForm.cnicOrId || !custForm.dateOfBirth || !custForm.address || !custForm.countryId || !custForm.emergencyName || !custForm.emergencyPhone) {
          toast.error('Please fill in all required fields')
          return
        }
        Object.entries(custForm).forEach(([k, v]) => formData.append(k, v))
        formData.append('userType', 'CUSTOMER')
      } else {
        if (!compForm.ownerName || !compForm.cnicOrId || !compForm.licenseNumber || !compForm.businessAddress || !compForm.whatsAppNumber || !compForm.countryId) {
          toast.error('Please fill in all required fields')
          return
        }
        Object.entries(compForm).forEach(([k, v]) => formData.append(k, v))
        formData.append('userType', userRole!)
        const docs = [
          { file: licenseFile, label: 'Business license' },
          { file: cnicFrontFile, label: 'CNIC front' },
          { file: cnicBackFile, label: 'CNIC back' },
        ]
        for (const { file, label } of docs) {
          if (!file) continue
          const check = validateCompanyDocumentFile(file)
          if (!check.valid) {
            toast.error(`${label}: ${check.error}`)
            return
          }
        }
        if (licenseFile) formData.append('licenseDocument', licenseFile)
        if (cnicFrontFile) formData.append('cnicFront', cnicFrontFile)
        if (cnicBackFile) formData.append('cnicBack', cnicBackFile)
      }

      const res = await fetch('/api/auth/profile/complete', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Profile submitted for admin review! You will be notified once approved.')
        // Stay on visit page but show success — user is PENDING review
        router.push('/auth?status=pending')
      } else {
        toast.error(data.error || 'Failed to submit profile.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "input-dark text-sm w-full"
  const labelClass = "text-xs font-medium text-slate-400 mb-1 block"

  const FileUploadBox = ({
    label, file, onChange, id
  }: { label: string; file: File | null; onChange: (f: File) => void; id: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <label htmlFor={id}
        className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors bg-white/2 min-h-[80px]">
        {file ? (
          <div className="flex flex-col items-center gap-1">
            {file.type.startsWith('image/') && (
              <Image src={URL.createObjectURL(file)} alt={label} width={80} height={56} className="rounded object-cover" />
            )}
            <span className="text-xs text-emerald-400 font-semibold">✓ {file.name}</span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-2xl block mb-1">📁</span>
            <span className="text-xs text-slate-500">Click to upload</span>
          </div>
        )}
        <input id={id} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" className="hidden"
          onChange={e => {
            const next = e.target.files?.[0]
            if (!next) return
            const check = validateCompanyDocumentFile(next)
            if (!check.valid) {
              toast.error(check.error || 'Invalid file')
              e.target.value = ''
              return
            }
            onChange(next)
          }} />
      </label>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
      <ParticleBackground />
      <div className="fixed top-0 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <div className="relative z-10 flex flex-grow flex-col">
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 text-3xl">
              📋
            </div>
            <h1 className="font-heading font-black text-3xl text-slate-900 dark:text-white mb-2">
              Complete Your <span className="gradient-text">Profile</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Your account has been approved! Provide your verification details to unlock full access, or skip and complete later.
            </p>
          </div>

          <div className="glass-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">

              <AnimatePresence mode="wait">
                {userRole === 'CUSTOMER' ? (
                  <motion.div key="cust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Father Name *</label>
                        <input className={inputClass} placeholder="Father full name"
                          value={custForm.fatherName} onChange={e => setCustForm(p => ({ ...p, fatherName: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Date of Birth *</label>
                        <input className={inputClass} type="date"
                          value={custForm.dateOfBirth} onChange={e => setCustForm(p => ({ ...p, dateOfBirth: e.target.value }))} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>National ID / CNIC *</label>
                      <input className={inputClass} placeholder={getIdPlaceholder(custForm.countryId)}
                        value={custForm.cnicOrId} onChange={e => setCustForm(p => ({ ...p, cnicOrId: e.target.value }))} required />
                    </div>
                    <div>
                      <label className={labelClass}>Home Address *</label>
                      <input className={inputClass} placeholder="Full address"
                        value={custForm.address} onChange={e => setCustForm(p => ({ ...p, address: e.target.value }))} required />
                    </div>
                    <div>
                      <label className={labelClass}>Country *</label>
                      <select className={inputClass} value={custForm.countryId} onChange={e => setCustForm(p => ({ ...p, countryId: e.target.value }))} required>
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c.id} value={c.id}>{getFlagEmoji(c.code)} {c.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Emergency Contact Name *</label>
                        <input className={inputClass} placeholder="Emergency person name"
                          value={custForm.emergencyName} onChange={e => setCustForm(p => ({ ...p, emergencyName: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Emergency Phone *</label>
                        <input className={inputClass} type="tel" placeholder={getPhonePlaceholder(custForm.countryId)}
                          value={custForm.emergencyPhone} onChange={e => setCustForm(p => ({ ...p, emergencyPhone: e.target.value }))} required />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="comp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Owner Full Name *</label>
                        <input className={inputClass} placeholder="Owner name"
                          value={compForm.ownerName} onChange={e => setCompForm(p => ({ ...p, ownerName: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Owner CNIC / National ID *</label>
                        <input className={inputClass} placeholder={getIdPlaceholder(compForm.countryId)}
                          value={compForm.cnicOrId} onChange={e => setCompForm(p => ({ ...p, cnicOrId: e.target.value }))} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{getLicenseLabel(compForm.countryId)}</label>
                      <input className={inputClass} placeholder={getLicensePlaceholder(compForm.countryId)}
                        value={compForm.licenseNumber} onChange={e => setCompForm(p => ({ ...p, licenseNumber: e.target.value }))} required />
                    </div>
                    <div>
                      <label className={labelClass}>Business Address *</label>
                      <input className={inputClass} placeholder="Full business address"
                        value={compForm.businessAddress} onChange={e => setCompForm(p => ({ ...p, businessAddress: e.target.value }))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>WhatsApp Number *</label>
                        <input className={inputClass} type="tel" placeholder={getPhonePlaceholder(compForm.countryId)}
                          value={compForm.whatsAppNumber} onChange={e => setCompForm(p => ({ ...p, whatsAppNumber: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Country *</label>
                        <select className={inputClass} value={compForm.countryId} onChange={e => setCompForm(p => ({ ...p, countryId: e.target.value }))} required>
                          <option value="">Select Country</option>
                          {countries.map(c => <option key={c.id} value={c.id}>{getFlagEmoji(c.code)} {c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs font-semibold text-slate-400 mb-3">📁 Upload Documents</p>
                      <div className="grid grid-cols-3 gap-3">
                        <FileUploadBox label={userRole === 'HOTEL' ? 'Hotel License' : 'Business License'} file={licenseFile} onChange={setLicenseFile} id="upload-license" />
                        <FileUploadBox label="ID / CNIC Front" file={cnicFrontFile} onChange={setCnicFrontFile} id="upload-cnic-front" />
                        <FileUploadBox label="ID / CNIC Back" file={cnicBackFile} onChange={setCnicBackFile} id="upload-cnic-back" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="btn-primary w-full py-3 font-bold">
                  {submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : '✅ Submit for Verification'}
                </button>

                <button type="button" disabled={skipping} onClick={handleSkip}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm font-medium">
                  {skipping ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : '⏭️ Skip for Now — Go to Dashboard'}
                </button>
              </div>

              <p className="text-2xs text-slate-500 text-center pt-1">
                You can always complete verification later from your dashboard settings.
              </p>
            </form>
          </div>
        </motion.div>
      </main>
      <Footer />
      </div>
    </div>
  )
}

export default function VisitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <VisitContent />
    </Suspense>
  )
}

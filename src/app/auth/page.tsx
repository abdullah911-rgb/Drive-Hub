'use client'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import ParticleBackground from '@/components/shared/ParticleBackground'
import CompanyFormFields from '@/components/shared/CompanyFormFields'
import CompanyDocumentUploads, {
  EMPTY_COMPANY_DOCUMENTS,
  appendCompanyDocumentsToFormData,
  type CompanyDocumentFiles,
} from '@/components/shared/CompanyDocumentUploads'
import ValidatedInput from '@/components/shared/ValidatedInput'
import { getFlagEmoji } from '@/lib/utils'
import { validateCompanyForm, getCountryFormConfig, applyFieldFormat, validateCountryField } from '@/lib/countryFormConfig'
import { validateRequiredText, validateEmail } from '@/lib/liveValidation'
import { validateCompanyDocuments } from '@/lib/companyDocuments'
import { SUBSCRIPTION_BASE_PKR } from '@/lib/subscription'
import { formatSubscriptionPrice } from '@/lib/currency'

type AuthTab = 'login' | 'signup'
type SignupRole = 'CUSTOMER' | 'COMPANY'

function AuthContent() {
  const [tab, setTab] = useState<AuthTab>('login')
  const [signupRole, setSignupRole] = useState<SignupRole>('CUSTOMER')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [countries, setCountries] = useState<{ id: string; name: string; code: string; currency: string }[]>([])
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('')
  const [subscriptionPreview, setSubscriptionPreview] = useState<{ price: string; currency: string }>({
    price: formatSubscriptionPrice(SUBSCRIPTION_BASE_PKR, 'PKR'),
    currency: 'PKR',
  })
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocumentFiles>({ ...EMPTY_COMPANY_DOCUMENTS })

  useEffect(() => {
    if (searchParams.get('tab') === 'signup') setTab('signup')
    const roleParam = searchParams.get('role')
    if (roleParam === 'COMPANY') setSignupRole('COMPANY')

    const error = searchParams.get('error')
    if (error === 'unauthorized') toast.error('Access denied. Please log in with the correct role.')
    if (error === 'account_suspended') toast.error('Your account has been suspended.')
    const status = searchParams.get('status')
    if (status === 'pending') toast.info('Your account is pending admin approval.')
  }, [searchParams])

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/api/countries')
        const data = await res.json()
        if (data.success) {
          setCountries(data.data)

          const sessionCountry = sessionStorage.getItem('selectedCountry')
          if (sessionCountry) {
            setSelectedCountryCode(sessionCountry)
          } else if (data.data.length > 0) {
            setSelectedCountryCode(data.data[0].code)
            sessionStorage.setItem('selectedCountry', data.data[0].code)
          }
        }
      } catch (err) {
        console.error('Failed to load countries', err)
      }
    }
    loadCountries()
  }, [])

  const [loginData, setLoginData] = useState({ emailOrPhone: '', password: '' })
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Welcome back!')
        router.push(data.data.redirectTo)
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('Login failed. Please try again.') }
    finally { setLoading(false) }
  }

  const [custData, setCustData] = useState({
    fullName: '', fatherName: '', cnicOrId: '', dateOfBirth: '', phone: '',
    email: '', address: '', countryId: '', emergencyName: '', emergencyPhone: '',
    password: '', confirmPassword: ''
  })

  const [compData, setCompData] = useState({
    companyName: '', ownerName: '', cnicOrId: '', contactNumber: '', whatsAppNumber: '',
    email: '', businessAddress: '', countryId: '', licenseNumber: '',
    password: '', confirmPassword: '', companyType: 'CAR_RENTAL'
  })

  useEffect(() => {
    if (selectedCountryCode && countries.length > 0) {
      const matched = countries.find(c => c.code === selectedCountryCode)
      if (matched) {
        setCustData(prev => ({ ...prev, countryId: matched.id }))
        setCompData(prev => ({ ...prev, countryId: matched.id }))
      }
    }
  }, [selectedCountryCode, countries])

  const handleGlobalCountryChange = (code: string) => {
    setSelectedCountryCode(code)
    sessionStorage.setItem('selectedCountry', code)
  }

  useEffect(() => {
    if (!selectedCountryCode || countries.length === 0) return
    const country = countries.find(c => c.code === selectedCountryCode)
    if (!country) return
    const fetchPrice = async () => {
      try {
        const res = await fetch(`/api/currency?to=${country.currency}&amount=${SUBSCRIPTION_BASE_PKR}`)
        const data = await res.json()
        if (data.success) {
          const { converted, to } = data.data
          setSubscriptionPreview({
            price: formatSubscriptionPrice(converted, to),
            currency: to,
          })
        }
      } catch {
        setSubscriptionPreview({
          price: formatSubscriptionPrice(SUBSCRIPTION_BASE_PKR, 'PKR'),
          currency: 'PKR',
        })
      }
    }
    fetchPrice()
  }, [selectedCountryCode, countries])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = signupRole === 'CUSTOMER' ? custData : compData
    if ((data as typeof custData).password !== (data as typeof custData).confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (signupRole === 'COMPANY') {
      const country = countries.find(c => c.id === compData.countryId)
      const validation = validateCompanyForm(country?.code || 'PK', compData, compData.companyType === 'HOTEL')
      if (!validation.valid) {
        toast.error(validation.message || 'Please check your form fields')
        return
      }
      const docValidation = validateCompanyDocuments(companyDocuments, compData.companyType === 'HOTEL')
      if (!docValidation.valid) {
        toast.error(docValidation.error || 'Please upload all required documents')
        return
      }
    }

    if (signupRole === 'CUSTOMER') {
      const cc = customerCountryCode
      const checks = [
        validateRequiredText(custData.fullName, 'Full name', 2),
        validateRequiredText(custData.fatherName, 'Father name', 2),
        validateCountryField(cc, 'nationalId', custData.cnicOrId),
        validateCountryField(cc, 'phone', custData.phone),
        validateEmail(custData.email),
        validateRequiredText(custData.address, 'Address', 5),
        validateCountryField(cc, 'phone', custData.emergencyPhone),
      ]
      const failed = checks.find(c => !c.valid)
      if (failed) {
        toast.error(failed.message || 'Please check your form fields')
        return
      }
    }

    setLoading(true)
    try {
      let res: Response
      if (signupRole === 'COMPANY') {
        const formData = new FormData()
        Object.entries(compData).forEach(([key, value]) => formData.append(key, value))
        appendCompanyDocumentsToFormData(formData, companyDocuments)
        res = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
      } else {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: 'customer', ...custData }),
        })
      }
      const json = await res.json()
      if (json.success) {
        toast.success('Registration submitted! Awaiting admin approval.')
        if (json.data?.otp) toast.info(`[Dev] Your OTP: ${json.data.otp}`, { duration: 10000 })
        setTab('login')
      } else {
        toast.error(json.error)
      }
    } catch { toast.error('Registration failed.') }
    finally { setLoading(false) }
  }

  const handleCompChange = useCallback((updates: Partial<typeof compData>) => {
    setCompData(prev => ({ ...prev, ...updates }))
  }, [])

  const customerCountryCode = countries.find(c => c.id === custData.countryId)?.code || selectedCountryCode || 'PK'
  const customerCountryConfig = getCountryFormConfig(customerCountryCode)

  const inputClass = "input-dark text-sm"
  const labelClass = "text-xs font-medium text-slate-400 mb-1 block"

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8">
      <ParticleBackground />
      <div className="fixed top-0 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-neon-violet">D</div>
            <span className="font-heading font-bold text-xl gradient-text">DriveHub</span>
          </Link>
          <p className="text-slate-400 text-sm">Premium Car Rental Marketplace</p>
        </div>

        <div className="glass-card p-6 md:p-8">

          <div className="mb-6">
            <label className={labelClass}>Select Your Country</label>
            <select
              value={selectedCountryCode}
              onChange={e => handleGlobalCountryChange(e.target.value)}
              className={`${inputClass} font-semibold`}
            >
              {countries.map(c => (
                <option key={c.code} value={c.code}>
                  {getFlagEmoji(c.code)} {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-1 p-1 glass rounded-xl mb-6">
            {(['login', 'signup'] as AuthTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                  tab === t ? 'gradient-primary text-white shadow-neon-violet' : 'text-slate-400 hover:text-white'
                }`}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {tab === 'login' && (
              <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelClass}>Email or Phone Number</label>
                  <input className={inputClass} type="text" placeholder="you@email.com"
                    value={loginData.emailOrPhone} onChange={e => setLoginData(p => ({ ...p, emailOrPhone: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <input className={inputClass} type="password" placeholder="••••••••"
                    value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))} required />
                </div>
                <div className="text-right">
                  <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</button>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
                </button>
              </motion.form>
            )}

            {tab === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                <div className="flex gap-2 mb-5">
                  {([
                    { role: 'CUSTOMER', icon: '👤', label: 'Customer' },
                    { role: 'COMPANY', icon: '🏢', label: 'Company / Owner' },
                  ] as { role: SignupRole; icon: string; label: string }[]).map(({ role, icon, label }) => (
                    <button key={role} onClick={() => setSignupRole(role)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        signupRole === role
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                      }`}>
                      <span>{icon}</span> {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleRegister} className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {signupRole === 'CUSTOMER' ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <ValidatedInput
                          label="Full Name"
                          value={custData.fullName}
                          onChange={v => setCustData(p => ({ ...p, fullName: v }))}
                          validate={v => validateRequiredText(v, 'Full name', 2)}
                          placeholder="Ali Hassan"
                        />
                        <ValidatedInput
                          label="Father Name"
                          value={custData.fatherName}
                          onChange={v => setCustData(p => ({ ...p, fatherName: v }))}
                          validate={v => validateRequiredText(v, 'Father name', 2)}
                          placeholder="Hassan Ahmed"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ValidatedInput
                          key={`${customerCountryCode}-cust-id`}
                          label={customerCountryConfig.nationalId.label}
                          value={custData.cnicOrId}
                          onChange={v => setCustData(p => ({ ...p, cnicOrId: applyFieldFormat(customerCountryCode, 'nationalId', v) }))}
                          validate={v => validateCountryField(customerCountryCode, 'nationalId', v)}
                          hint={customerCountryConfig.nationalId.hint}
                          example={customerCountryConfig.nationalId.example}
                          placeholder={customerCountryConfig.nationalId.placeholder}
                          maxLength={customerCountryConfig.nationalId.maxLength}
                        />
                        <div>
                          <label className={labelClass}>Date of Birth *</label>
                          <input className={inputClass} type="date" value={custData.dateOfBirth} onChange={e => setCustData(p => ({ ...p, dateOfBirth: e.target.value }))} required />
                        </div>
                      </div>
                      <ValidatedInput
                        key={`${customerCountryCode}-cust-phone`}
                        label="Phone Number"
                        value={custData.phone}
                        onChange={v => setCustData(p => ({ ...p, phone: applyFieldFormat(customerCountryCode, 'phone', v) }))}
                        validate={v => validateCountryField(customerCountryCode, 'phone', v)}
                        hint={customerCountryConfig.phone.hint}
                        example={customerCountryConfig.phone.example}
                        placeholder={customerCountryConfig.phone.placeholder}
                        maxLength={customerCountryConfig.phone.maxLength}
                      />
                      <ValidatedInput
                        label="Email"
                        type="email"
                        value={custData.email}
                        onChange={v => setCustData(p => ({ ...p, email: v }))}
                        validate={validateEmail}
                        placeholder="you@example.com"
                      />
                      <ValidatedInput
                        label="Address"
                        value={custData.address}
                        onChange={v => setCustData(p => ({ ...p, address: v }))}
                        validate={v => validateRequiredText(v, 'Address', 5)}
                        placeholder={customerCountryConfig.address.placeholder}
                      />
                      <div>
                        <label className={labelClass}>Country *</label>
                        <select className={inputClass} value={custData.countryId} onChange={e => {
                          const matched = countries.find(c => c.id === e.target.value)
                          if (matched) handleGlobalCountryChange(matched.code)
                          setCustData(p => ({ ...p, countryId: e.target.value, cnicOrId: '', phone: '', emergencyPhone: '' }))
                        }} required>
                          <option value="">Select Country</option>
                          {countries.map(c => <option key={c.id} value={c.id}>{getFlagEmoji(c.code)} {c.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Emergency Contact Name *</label>
                          <input className={inputClass} placeholder="Sara Hassan" value={custData.emergencyName} onChange={e => setCustData(p => ({ ...p, emergencyName: e.target.value }))} required /></div>
                        <ValidatedInput
                          key={`${customerCountryCode}-emergency-phone`}
                          label="Emergency Phone"
                          value={custData.emergencyPhone}
                          onChange={v => setCustData(p => ({ ...p, emergencyPhone: applyFieldFormat(customerCountryCode, 'phone', v) }))}
                          validate={v => validateCountryField(customerCountryCode, 'phone', v)}
                          placeholder={customerCountryConfig.phone.placeholder}
                          maxLength={customerCountryConfig.phone.maxLength}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Password *</label>
                          <input className={inputClass} type="password" placeholder="Min 8 chars" value={custData.password} onChange={e => setCustData(p => ({ ...p, password: e.target.value }))} required /></div>
                        <div><label className={labelClass}>Confirm Password *</label>
                          <input className={inputClass} type="password" placeholder="Repeat password" value={custData.confirmPassword} onChange={e => setCustData(p => ({ ...p, confirmPassword: e.target.value }))} required /></div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Business Type Toggle */}
                      <div className="flex gap-2 mb-3">
                        {[
                          { type: 'CAR_RENTAL', label: '🚗 Car Rental' },
                          { type: 'HOTEL', label: '🏨 Hotel' },
                        ].map(opt => (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setCompData(p => ({ ...p, companyType: opt.type }))}
                            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                              compData.companyType === opt.type
                                ? 'border-primary/50 bg-primary/10 text-primary'
                                : 'border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <CompanyFormFields
                        form={compData}
                        onChange={handleCompChange}
                        onCountryChange={(_id, code) => handleGlobalCountryChange(code)}
                        countries={countries}
                        countryPosition="bottom"
                        showDocumentHint={false}
                        companyType={compData.companyType as 'CAR_RENTAL' | 'HOTEL'}
                      />
                      <CompanyDocumentUploads
                        documents={companyDocuments}
                        onChange={(docType, file) => setCompanyDocuments(prev => ({ ...prev, [docType]: file }))}
                        idLabel={countries.find(c => c.id === compData.countryId)?.code === 'PK' ? 'CNIC' : 'National ID'}
                        licenseLabel={compData.companyType === 'HOTEL' ? 'Hotel License' : 'Business License'}
                        companyType={compData.companyType as 'CAR_RENTAL' | 'HOTEL'}
                      />
                      <div><label className={labelClass}>Email *</label>
                        <input className={inputClass} type="email" placeholder="company@example.com" value={compData.email} onChange={e => setCompData(p => ({ ...p, email: e.target.value }))} required /></div>

                      <div className="glass rounded-xl p-3 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">📋 Monthly Subscription</span>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">{subscriptionPreview.price}</span>
                            <span className="text-slate-500 text-2xs"> / mo</span>
                          </div>
                        </div>

                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Password *</label>
                          <input className={inputClass} type="password" placeholder="Min 8 chars" value={compData.password} onChange={e => setCompData(p => ({ ...p, password: e.target.value }))} required /></div>
                        <div><label className={labelClass}>Confirm Password *</label>
                          <input className={inputClass} type="password" placeholder="Repeat password" value={compData.confirmPassword} onChange={e => setCompData(p => ({ ...p, confirmPassword: e.target.value }))} required /></div>
                      </div>
                    </>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                    {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Registration'}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    Registration requires admin approval before your account becomes active.
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          By continuing you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">Terms</a> &amp;{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <AuthContent />
    </Suspense>
  )
}

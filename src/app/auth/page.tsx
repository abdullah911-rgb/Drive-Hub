'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'
import { getFlagEmoji } from '@/lib/utils'
import { validateEmail } from '@/lib/liveValidation'
import { SUBSCRIPTION_BASE_PKR } from '@/lib/subscription'
import { formatSubscriptionPrice } from '@/lib/currency'
import SearchableSelect from '@/components/ui/SearchableSelect'

type AuthTab = 'login' | 'signup'
type SignupRole = 'CUSTOMER' | 'COMPANY'

function AuthContent() {
  const [tab, setTab] = useState<AuthTab>('login')
  const [signupRole, setSignupRole] = useState<SignupRole>('CUSTOMER')
  const [loading, setLoading] = useState(false)

  // Password visibility toggles
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [showCustPw, setShowCustPw] = useState(false)
  const [showCustConfPw, setShowCustConfPw] = useState(false)
  const [showCompPw, setShowCompPw] = useState(false)
  const [showCompConfPw, setShowCompConfPw] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [countries, setCountries] = useState<{ id: string; name: string; code: string; currency: string; dialCode: string }[]>([])
  const [subscriptionPreview, setSubscriptionPreview] = useState<{ price: string; currency: string }>({
    price: formatSubscriptionPrice(SUBSCRIPTION_BASE_PKR, 'PKR'),
    currency: 'PKR',
  })

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
        }
      } catch (err) {
        console.error('Failed to load countries', err)
      }
    }
    loadCountries()
  }, [])

  // Simple registration state — all sensitive info collected later on /visit
  const [custData, setCustData] = useState({
    fullName: '', phone: '', email: '', countryId: '', password: '', confirmPassword: ''
  })

  const [compData, setCompData] = useState({
    companyName: '', ownerName: '', contactNumber: '', email: '', countryId: '',
    password: '', confirmPassword: '', companyType: 'CAR_RENTAL'
  })

  // Update subscription preview when country changes (for company registration)
  useEffect(() => {
    if (!compData.countryId || countries.length === 0) return
    const country = countries.find(c => c.id === compData.countryId)
    if (!country) return
    const fetchPrice = async () => {
      try {
        const res = await fetch(`/api/currency?to=${country.currency}&amount=${SUBSCRIPTION_BASE_PKR}`)
        const data = await res.json()
        if (data.success) {
          setSubscriptionPreview({ price: formatSubscriptionPrice(data.data.converted, data.data.to), currency: data.data.to })
        }
      } catch {
        setSubscriptionPreview({ price: formatSubscriptionPrice(SUBSCRIPTION_BASE_PKR, 'PKR'), currency: 'PKR' })
      }
    }
    fetchPrice()
  }, [compData.countryId, countries])

  const [loginData, setLoginData] = useState({ emailOrPhone: '', password: '' })

  const getPhonePlaceholder = (countryId: string) => {
    const c = countries.find(x => x.id === countryId)
    return c ? `${c.dialCode} 123 456789` : "+92 300 0000000"
  }

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
        const name = data.data?.user?.fullName
        toast.success(name ? `Welcome back, ${name}! 👋` : 'Welcome back!')
        router.push(data.data.redirectTo)
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('Login failed. Please try again.') }
    finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (signupRole === 'CUSTOMER') {
      if (!custData.fullName.trim() || custData.fullName.trim().length < 2) {
        toast.error('Please enter your full name (at least 2 characters)')
        return
      }
      if (!custData.phone.trim()) {
        toast.error('Please enter your phone number')
        return
      }
      const emailCheck = validateEmail(custData.email)
      if (!emailCheck.valid) { toast.error(emailCheck.message || 'Invalid email'); return }
      if (!custData.countryId) { toast.error('Please select your country'); return }
      if (custData.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
      if (custData.password !== custData.confirmPassword) { toast.error('Passwords do not match'); return }
    } else {
      if (!compData.companyName.trim()) { toast.error('Please enter your company name'); return }
      if (!compData.ownerName.trim()) { toast.error('Please enter the owner name'); return }
      if (!compData.contactNumber.trim()) { toast.error('Please enter a contact number'); return }
      const emailCheck = validateEmail(compData.email)
      if (!emailCheck.valid) { toast.error(emailCheck.message || 'Invalid email'); return }
      if (!compData.countryId) { toast.error('Please select your country'); return }
      if (compData.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
      if (compData.password !== compData.confirmPassword) { toast.error('Passwords do not match'); return }
    }

    setLoading(true)
    try {
      let body: Record<string, string>
      if (signupRole === 'CUSTOMER') {
        body = { type: 'customer', ...custData }
      } else {
        body = { type: 'company', ...compData }
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Registration submitted! Awaiting admin approval.')
        setTab('login')
      } else {
        toast.error(json.error)
      }
    } catch { toast.error('Registration failed.') }
    finally { setLoading(false) }
  }

  const inputClass = "input-dark text-sm"
  const labelClass = "text-xs font-medium text-slate-400 mb-1 block"

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
      <ParticleBackground />
      <div className="fixed top-0 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <img src="/logo.png" alt="NextTripy Logo" className="w-10 h-10 rounded-xl" />
            <span className="font-heading font-bold text-xl">
              <span className="text-slate-900 dark:text-white">Next</span>
              <span className="text-blue-500">Tripy</span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm">Car Rentals · Hotel Rooms · Worldwide</p>
        </div>

        <div className="glass-card p-6 md:p-8">

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
                  <div className="relative">
                    <input className={inputClass} type={showLoginPw ? 'text' : 'password'} placeholder="••••••••"
                      value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))} required />
                    <button type="button" onClick={() => setShowLoginPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm select-none">
                      {showLoginPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
                </button>
              </motion.form>
            )}

            {tab === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                {/* Role selector */}
                <div className="flex gap-2 mb-5">
                  {([
                    { role: 'CUSTOMER', icon: '👤', label: 'Customer' },
                    { role: 'COMPANY', icon: '🏢', label: 'Company / Owner' },
                  ] as { role: SignupRole; icon: string; label: string }[]).map(({ role, icon, label }) => (
                    <button key={role} type="button" onClick={() => setSignupRole(role)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        signupRole === role
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                      }`}>
                      <span>{icon}</span> {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  {signupRole === 'CUSTOMER' ? (
                    <>
                      <div>
                        <label className={labelClass}>Full Name *</label>
                        <input className={inputClass} placeholder="Ali Hassan" value={custData.fullName}
                          onChange={e => setCustData(p => ({ ...p, fullName: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Email *</label>
                        <input className={inputClass} type="email" placeholder="you@example.com" value={custData.email}
                          onChange={e => setCustData(p => ({ ...p, email: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Phone Number *</label>
                        <input className={inputClass} type="tel" placeholder={getPhonePlaceholder(custData.countryId)} value={custData.phone}
                          onChange={e => setCustData(p => ({ ...p, phone: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Country *</label>
                        <SearchableSelect
                          value={custData.countryId}
                          onChange={v => setCustData(p => ({ ...p, countryId: v }))}
                          required
                          placeholder="Select Country"
                          searchPlaceholder="Type a letter… e.g. P"
                          options={countries.map(c => ({
                            value: c.id,
                            label: c.name,
                            prefix: getFlagEmoji(c.code),
                            keywords: c.code,
                          }))}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Password *</label>
                          <div className="relative">
                            <input className={inputClass} type={showCustPw ? 'text' : 'password'} placeholder="Min 8 chars" value={custData.password}
                              onChange={e => setCustData(p => ({ ...p, password: e.target.value }))} required />
                            <button type="button" onClick={() => setShowCustPw(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm select-none">
                              {showCustPw ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Confirm Password *</label>
                          <div className="relative">
                            <input className={inputClass} type={showCustConfPw ? 'text' : 'password'} placeholder="Repeat password" value={custData.confirmPassword}
                              onChange={e => setCustData(p => ({ ...p, confirmPassword: e.target.value }))} required />
                            <button type="button" onClick={() => setShowCustConfPw(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm select-none">
                              {showCustConfPw ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Business type toggle */}
                      <div className="flex gap-2 mb-1">
                        {[
                          { type: 'CAR_RENTAL', label: '🚗 Car Rental' },
                          { type: 'HOTEL', label: '🏨 Hotel' },
                        ].map(opt => (
                          <button key={opt.type} type="button"
                            onClick={() => setCompData(p => ({ ...p, companyType: opt.type }))}
                            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                              compData.companyType === opt.type
                                ? 'border-primary/50 bg-primary/10 text-primary'
                                : 'border-white/10 text-slate-400 hover:border-white/20'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>{compData.companyType === 'HOTEL' ? 'Hotel' : 'Company'} Name *</label>
                          <input className={inputClass} placeholder="My Business" value={compData.companyName}
                            onChange={e => setCompData(p => ({ ...p, companyName: e.target.value }))} required />
                        </div>
                        <div>
                          <label className={labelClass}>Owner Name *</label>
                          <input className={inputClass} placeholder="Full Name" value={compData.ownerName}
                            onChange={e => setCompData(p => ({ ...p, ownerName: e.target.value }))} required />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Email *</label>
                        <input className={inputClass} type="email" placeholder="company@example.com" value={compData.email}
                          onChange={e => setCompData(p => ({ ...p, email: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Contact Number *</label>
                        <input className={inputClass} type="tel" placeholder={getPhonePlaceholder(compData.countryId)} value={compData.contactNumber}
                          onChange={e => setCompData(p => ({ ...p, contactNumber: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelClass}>Country *</label>
                        <SearchableSelect
                          value={compData.countryId}
                          onChange={v => setCompData(p => ({ ...p, countryId: v }))}
                          required
                          placeholder="Select Country"
                          searchPlaceholder="Type a letter… e.g. P"
                          options={countries.map(c => ({
                            value: c.id,
                            label: c.name,
                            prefix: getFlagEmoji(c.code),
                            keywords: c.code,
                          }))}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Password *</label>
                          <div className="relative">
                            <input className={inputClass} type={showCompPw ? 'text' : 'password'} placeholder="Min 8 chars" value={compData.password}
                              onChange={e => setCompData(p => ({ ...p, password: e.target.value }))} required />
                            <button type="button" onClick={() => setShowCompPw(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm select-none">
                              {showCompPw ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Confirm Password *</label>
                          <div className="relative">
                            <input className={inputClass} type={showCompConfPw ? 'text' : 'password'} placeholder="Repeat password" value={compData.confirmPassword}
                              onChange={e => setCompData(p => ({ ...p, confirmPassword: e.target.value }))} required />
                            <button type="button" onClick={() => setShowCompConfPw(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm select-none">
                              {showCompConfPw ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                    {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
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
      </main>

      <Footer />
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

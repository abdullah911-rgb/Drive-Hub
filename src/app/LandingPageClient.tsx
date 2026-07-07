'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'
import RegisterCompanyModal from '@/components/shared/RegisterCompanyModal'
import { CarCard, CompanyCard } from '@/components/shared/Cards'
import { CarCardSkeleton } from '@/components/ui'
import type { Car, Company } from '@/types'

interface LandingPageClientProps {
  initialCars: Car[]
  initialCompanies: Company[]
  stats: { carCount: number; companyCount: number; brandCount: number }
}

function LandingContent({ initialCars, initialCompanies, stats: initialStats }: LandingPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [cars, setCars] = useState<Car[]>(initialCars)
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(initialCars.length === 0 && initialCompanies.length === 0)
  const [user, setUser] = useState<{ role: string; status: string; countryId?: string } | null>(null)
  const [registerCompanyOpen, setRegisterCompanyOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('status') === 'pending') {
      toast.info('Your account is pending admin approval.')
    }
    if (searchParams.get('registerCompany') === 'true') {
      setRegisterCompanyOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.data) setUser(data.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (initialCars.length > 0 || initialCompanies.length > 0) return

    async function loadData() {
      try {
        const [carsRes, companiesRes] = await Promise.all([
          fetch('/api/cars?status=APPROVED&limit=6&lite=true'),
          fetch('/api/companies?status=APPROVED&limit=4&lite=true'),
        ])
        if (carsRes.ok) {
          const data = await carsRes.json()
          setCars(data.data || [])
          const total = data.pagination?.total
          if (typeof total === 'number') {
            setStats((prev) => ({ ...prev, carCount: total }))
          }
        }
        if (companiesRes.ok) {
          const data = await companiesRes.json()
          setCompanies(data.data || [])
          const total = data.pagination?.total
          if (typeof total === 'number') {
            setStats((prev) => ({ ...prev, companyCount: total }))
          }
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [initialCars.length, initialCompanies.length])

  const brands = [...new Set(cars.map(c => c.brand))].sort()
  const featuredCars = cars.slice(0, 6)
  const featuredCompanies = companies.slice(0, 4)

  const featuresList = [
    {
      icon: '🌍',
      title: 'Global Coverage',
      desc: 'Browse verified car listings across multiple countries and major international cities.',
      accent: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    },
    {
      icon: '💬',
      title: 'Direct WhatsApp Contact',
      desc: 'Connect with rental companies and individual owners directly with no middlemen or extra fees.',
      accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      icon: '🚗',
      title: 'Diverse Fleet Options',
      desc: 'From budget econo-cars to premium luxury rides and SUVs, find the perfect ride for any occasion.',
      accent: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    },
  ]

  const statItems = [
    { value: `${stats.carCount}+`, label: 'Cars Listed' },
    { value: `${stats.companyCount}+`, label: 'Companies' },
    { value: `${stats.brandCount}+`, label: 'Car Brands' },
    { value: 'Multiple', label: 'Countries Supported' },
  ]

  const openRegisterCompany = () => {
    if (!user) {
      router.push('/auth?tab=signup&role=COMPANY')
      return
    }
    if (user.role !== 'CUSTOMER') {
      toast.info('You already have a company account')
      return
    }
    setRegisterCompanyOpen(true)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <ParticleBackground />

      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <div className="relative z-10 flex flex-col min-h-screen pt-16">
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 border border-primary/20 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Premium Car Rental Marketplace</span>
            </div>

            <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl text-white mb-8 tracking-tight leading-[0.9]">
              Find Your
              <br />
              <span className="gradient-text-full">Perfect Ride</span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Connect directly with trusted car rental companies and independent owners{' '}
              <span className="text-primary font-semibold underline decoration-2 decoration-accent/50 underline-offset-4">globally</span>.
              Browse, chat on WhatsApp, and ride with ease.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a href="#cars" className="btn-primary px-8 py-4 text-base font-bold shadow-lg rounded-xl w-full sm:w-auto">
                Browse Cars
              </a>
              <a href="#companies" className="btn-secondary px-8 py-4 text-base font-bold rounded-xl w-full sm:w-auto text-white shadow-lg">
                View Companies
              </a>
            </div>

            {user?.role === 'CUSTOMER' && user.status === 'APPROVED' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <button
                  onClick={openRegisterCompany}
                  className="inline-flex items-center gap-2 glass px-5 py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all text-sm font-bold"
                >
                  <span>🏢</span> Own a fleet? Register your company here
                </button>
              </motion.div>
            )}

            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button onClick={() => router.push('/auth')} className="btn-ghost px-6 py-3 text-sm font-semibold rounded-xl">
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/auth?tab=signup&role=COMPANY')}
                  className="text-sm text-slate-400 hover:text-primary font-semibold transition-colors"
                >
                  List Your Fleet →
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-4">
              {featuresList.map((f, idx) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + idx * 0.15 }}
                  className="glass-card p-6 text-left border border-border hover:border-primary/20 transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${f.accent} mb-4 shrink-0 shadow-sm`}>
                    {f.icon}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-20 flex flex-wrap gap-10 justify-center"
          >
            {statItems.map(stat => (
              <div key={stat.label} className="text-center min-w-[140px] px-4 py-2 rounded-2xl bg-card/10 border border-border/5 shadow-sm">
                <div className="text-3xl font-heading font-black gradient-text-full leading-none">{stat.value}</div>
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-12 flex flex-wrap gap-4 justify-center"
          >
            {[
              { icon: '🔒', text: 'Verified Companies' },
              { icon: '💬', text: 'Direct WhatsApp Contact' },
              { icon: '🚗', text: 'Diverse Fleet' },
              { icon: '⭐', text: 'Trusted Reviews' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-2 glass px-4 py-2 rounded-full border border-border shadow-sm">
                <span className="text-sm">{f.icon}</span>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{f.text}</span>
              </div>
            ))}
          </motion.div>
        </main>

        {brands.length > 0 && (
          <section id="brands" className="px-6 py-16 border-t border-border/30">
            <div className="container-app max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-3">Popular Brands</h2>
                <p className="text-slate-400 text-sm">Explore vehicles from trusted manufacturers</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {brands.map(brand => (
                  <a
                    key={brand}
                    href="#cars"
                    className="glass px-5 py-2.5 rounded-xl border border-border hover:border-primary/30 text-slate-300 hover:text-primary font-bold text-sm transition-all"
                  >
                    {brand}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="cars" className="px-6 py-16 border-t border-border/30">
          <div className="container-app max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-3">Available Cars</h2>
                <p className="text-slate-400 text-sm">Browse approved listings and contact owners directly</p>
              </div>
              <Link href="/marketplace" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                View All Cars →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <CarCardSkeleton key={i} />)}
              </div>
            ) : featuredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {featuredCars.map((car, i) => <CarCard key={car.id} car={car} priority={i < 4} />)}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl border border-border">
                <p className="text-slate-400">No cars listed yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        <section id="companies" className="px-6 py-16 border-t border-border/30">
          <div className="container-app max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-3">Registered Companies</h2>
                <p className="text-slate-400 text-sm">Trusted rental partners across our marketplace</p>
              </div>
              <Link href="/marketplace/companies" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                View All Companies →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-card h-40 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : featuredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredCompanies.map(company => <CompanyCard key={company.id} company={company} />)}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl border border-border">
                <p className="text-slate-400">No companies registered yet.</p>
              </div>
            )}
          </div>
        </section>

        {(!user || (user.role === 'CUSTOMER' && user.status === 'APPROVED')) && (
          <section className="px-6 py-16 border-t border-border/30">
            <div className="container-app max-w-3xl mx-auto text-center glass-card p-10 border border-primary/20">
              <h2 className="font-heading font-black text-2xl md:text-3xl text-white mb-4">
                {user ? 'Ready to list your own cars?' : 'Are you a car rental company?'}
              </h2>
              <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
                {user
                  ? 'Register your company on our platform and get access to the company panel to manage your fleet and subscriptions.'
                  : 'Join our marketplace, reach customers worldwide, and manage your fleet from a dedicated company panel.'}
              </p>
              <button onClick={openRegisterCompany} className="btn-primary px-8 py-3 font-bold rounded-xl">
                {user ? 'Register Your Company' : 'Get Started as a Company'}
              </button>
            </div>
          </section>
        )}

        <Footer />
      </div>

      <RegisterCompanyModal
        open={registerCompanyOpen}
        onClose={() => setRegisterCompanyOpen(false)}
        defaultCountryId={user?.countryId}
      />
    </div>
  )
}

export default function LandingPageClient(props: LandingPageClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LandingContent {...props} />
    </Suspense>
  )
}

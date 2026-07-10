'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
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

interface Room {
  id: string
  name: string
  roomType: string
  description: string
  pricePerNight: number
  capacity: number
  images?: { id: string; imageUrl: string; isPrimary?: boolean }[]
  company?: { name: string }
}

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
  const [rooms, setRooms] = useState<Room[]>([])
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
        const [carsRes, companiesRes, roomsRes] = await Promise.all([
          fetch('/api/cars?status=APPROVED&limit=6&lite=true'),
          fetch('/api/companies?status=APPROVED&limit=100&lite=true'),
          fetch('/api/rooms?status=APPROVED&limit=3'),
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
        if (roomsRes.ok) {
          const data = await roomsRes.json()
          setRooms(data.data || [])
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
  const carCompanies = companies.filter(c => c.companyType !== 'HOTEL').slice(0, 4)
  const hotelCompanies = companies.filter(c => c.companyType === 'HOTEL').slice(0, 4)
  const featuredRooms = rooms.slice(0, 3)

  const featuresList = [
    {
      icon: '🌍',
      title: 'Global Coverage',
      desc: 'Browse verified car & hotel listings across multiple countries and international cities.',
      accent: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    },
    {
      icon: '💬',
      title: 'Direct WhatsApp Contact',
      desc: 'Connect with rental companies and hotels directly — no middlemen, no extra fees.',
      accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      icon: '🏨',
      title: 'Cars & Hotels in One Place',
      desc: 'From premium rides to luxury suites — book your entire trip through a single platform.',
      accent: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    },
  ]

  const statItems = [
    { value: `${stats.carCount}+`, label: 'Cars Listed' },
    { value: `${stats.companyCount}+`, label: 'Partners' },
    { value: `${stats.brandCount}+`, label: 'Car Brands' },
    { value: 'Multi', label: 'Countries' },
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
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Car Rentals &amp; Hotel Rooms Marketplace</span>
            </div>

            <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl text-white mb-8 tracking-tight leading-[0.9]">
              Drive, Stay,
              <br />
              <span className="gradient-text-full">Explore</span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Connect directly with trusted car rental companies and hotels{' '}
              <span className="text-primary font-semibold underline decoration-2 decoration-accent/50 underline-offset-4">globally</span>.
              Book your perfect ride and stay — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a href="#cars" className="btn-primary px-8 py-4 text-base font-bold shadow-lg rounded-xl w-full sm:w-auto">
                🚗 Browse Cars
              </a>
              <Link href="/marketplace/rooms" className="btn-secondary px-8 py-4 text-base font-bold rounded-xl w-full sm:w-auto text-white shadow-lg">
                🏨 Browse Hotels
              </Link>
            </div>

            {user?.role === 'CUSTOMER' && user.status === 'APPROVED' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <button
                  onClick={openRegisterCompany}
                  className="inline-flex items-center gap-2 glass px-5 py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all text-sm font-bold"
                >
                  <span>🏢</span> Own a fleet or hotel? Register your business
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
                  List Your Fleet or Hotel →
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
              { icon: '🚗', text: 'Car Rentals' },
              { icon: '🏨', text: 'Hotel Rooms' },
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
                <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-3">Car Rental Partners</h2>
                <p className="text-slate-400 text-sm">Top car rental fleets across our marketplace</p>
              </div>
              <Link href="/marketplace/companies?type=CAR_RENTAL" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                View All Partners →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card h-40 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : carCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carCompanies.map(company => <CompanyCard key={company.id} company={company} />)}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl border border-border">
                <p className="text-slate-400">No car rental companies registered yet.</p>
              </div>
            )}
          </div>
        </section>

        <section id="hotel-partners" className="px-6 py-16 border-t border-border/30">
          <div className="container-app max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-3">Hotel Partners</h2>
                <p className="text-slate-400 text-sm">Verified hotel partners and luxury accommodations</p>
              </div>
              <Link href="/marketplace/companies?type=HOTEL" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                View All Hotels →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card h-40 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : hotelCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotelCompanies.map(company => <CompanyCard key={company.id} company={company} />)}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl border border-border">
                <p className="text-slate-400">No hotel partners registered yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Hotels Section */}
        <section id="hotels" className="px-6 py-16 border-t border-border/30">
          <div className="container-app max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold px-3 py-1 rounded-full mb-3">🏨 Hotels</div>
                <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-3">Featured Hotel Rooms</h2>
                <p className="text-slate-400 text-sm">Premium accommodation from verified hotel partners</p>
              </div>
              <Link href="/marketplace/rooms" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                Browse All Rooms →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card h-72 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : featuredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredRooms.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link href={`/marketplace/rooms/${room.id}`} className="block group">
                      <div className="glass-card overflow-hidden h-full">
                        <div className="relative h-48 bg-white/5 overflow-hidden">
                          {room.images?.[0] ? (
                            <Image src={room.images[0].imageUrl} alt={room.name} fill className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">🛏️</div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="text-xs bg-primary/90 text-white px-2 py-1 rounded-lg font-bold">${room.pricePerNight}/night</span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="text-xs bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg">{room.roomType}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-white text-sm">{room.name}</h3>
                          {room.company && <p className="text-xs text-primary mt-0.5">{room.company.name}</p>}
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{room.description}</p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                            <span className="text-xs text-slate-500">👥 {room.capacity} guests</span>
                            <span className="text-xs text-primary font-bold">View Details →</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl border border-border">
                <div className="text-4xl mb-3">🏨</div>
                <p className="text-slate-400">Hotel listings coming soon. Register your hotel today!</p>
                <button onClick={openRegisterCompany} className="btn-primary px-5 py-2 mt-4 text-sm">Register a Hotel</button>
              </div>
            )}
          </div>
        </section>

        {(!user || (user.role === 'CUSTOMER' && user.status === 'APPROVED')) && (
          <section className="px-6 py-16 border-t border-border/30">
            <div className="container-app max-w-3xl mx-auto text-center glass-card p-10 border border-primary/20">
              <div className="flex justify-center gap-4 text-3xl mb-4">🚗 🏨</div>
              <h2 className="font-heading font-black text-2xl md:text-3xl text-white mb-4">
                {user ? 'List your cars or hotel rooms' : 'Are you a car rental company or hotel?'}
              </h2>
              <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
                {user
                  ? 'Register your business and get access to a dedicated dashboard to manage listings and subscriptions.'
                  : 'Join our marketplace, reach thousands of customers worldwide, and manage your fleet or hotel from a dedicated panel.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={openRegisterCompany} className="btn-primary px-8 py-3 font-bold rounded-xl">
                  {user ? 'Register Your Business' : 'Get Started'}
                </button>
              </div>
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

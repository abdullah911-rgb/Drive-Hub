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
  stats: { carCount: number; companyCount: number; brandCount: number; countryCount: number }
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
      .then((data) => {
        if (data?.data) {
          setUser(data.data)
          if (data.data.role === 'CUSTOMER' && data.data.cnicOrId === 'Pending') {
            router.push('/visit')
          }
        }
      })
      .catch(() => {})
  }, [router])

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
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      title: 'Trusted local partners',
      desc: 'Verified rental companies and hotels across Pakistan, Saudi Arabia, the UAE, and more.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
      title: 'Reach out on WhatsApp',
      desc: 'Found something you like? Message the provider directly — quick, personal, and free.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      ),
      title: 'Cars and rooms together',
      desc: 'Plan your whole trip in one place — a rental car and a hotel room, side by side.',
    },
  ]

  const statItems = [
    stats.carCount > 0 ? { value: `${stats.carCount}+`, label: 'Cars available' } : null,
    stats.companyCount > 0 ? { value: `${stats.companyCount}+`, label: 'Partners' } : null,
    stats.brandCount > 0 ? { value: `${stats.brandCount}+`, label: 'Car brands' } : null,
    stats.countryCount > 0 ? { value: `${stats.countryCount}+`, label: 'Countries' } : null,
  ].filter(Boolean) as { value: string; label: string }[]

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

  const GoogleAd = ({ className = "", maxWidthClass = "max-w-7xl" }: { className?: string; maxWidthClass?: string }) => (
    <div className={`w-full ${maxWidthClass} mx-auto px-6 ${className}`}>
      <div className="relative w-full bg-[#0b0c10]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl p-2 md:p-3 flex items-center justify-between gap-4 h-20 md:h-24 group">
        <span className="absolute top-1 left-2 text-[8px] text-slate-500 font-bold uppercase tracking-wider bg-white/5 px-1 py-0.5 rounded select-none">Ad</span>
        <div className="flex items-center gap-3 w-full h-full">
          <div className="relative h-full aspect-[16/9] rounded-lg overflow-hidden flex-shrink-0 border border-white/5 bg-white/5">
            {/* Using standard img tag because next/image component doesn't support jfif files natively */}
            <img src="/ads.jfif" alt="Google Ad" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-2xs md:text-xs font-bold truncate" style={{ color: '#ffffff' }}>Special Trip Offer ✈️</h4>
            <p className="text-[10px] line-clamp-1 mt-0.5 font-medium" style={{ color: '#94a3b8' }}>Rent cars or book hotel rooms with special discounts. Directly message providers on WhatsApp!</p>
            <span className="text-[9px] hover:text-slate-300 transition-colors cursor-pointer mt-0.5 block font-mono" style={{ color: '#64748b' }}>nexttripy.com</span>
          </div>
          <a href="https://nexttripy.com" target="_blank" rel="noopener noreferrer" className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95">
            Learn More
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <ParticleBackground />
      <Navbar />

      <div className="relative flex flex-col min-h-screen pt-16">
        {/* Top Ad (Navbar & Hero Gap) */}
        <GoogleAd className="mt-2 mb-0" />

        {/* Hero */}
        <section className="px-6 pb-6 pt-2">
          <div className="container-app max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side: Content */}
            <motion.div
              className="lg:col-span-7 text-left flex flex-col items-start"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                ✨ Car rentals &amp; hotel rooms
              </span>

              <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
                Find the perfect{' '}
                <span className="text-primary">car or room</span>{' '}
                for your next trip
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg max-w-xl leading-relaxed mb-8 font-medium">
                Welcome to NextTripy — discover rental cars and hotel rooms from trusted local partners.
                Browse at your own pace, then get in touch directly when you&apos;re ready to book.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto mb-8">
                <a href="#cars" className="btn-primary px-8 py-3.5 text-sm font-bold w-full sm:w-auto text-center shadow-lg hover:shadow-primary/30 transition-all">
                  Browse Cars
                </a>
                <Link href="/marketplace/rooms" className="px-8 py-3.5 text-sm font-bold w-full sm:w-auto text-center shadow-lg rounded-xl bg-green-500 hover:bg-green-400 text-white transition-all hover:shadow-green-400/30">
                  Browse Hotel Rooms
                </Link>
              </div>

              {user?.role === 'CUSTOMER' && user.status === 'APPROVED' && (
                <button
                  onClick={openRegisterCompany}
                  className="text-sm text-primary hover:text-primary-600 font-bold transition-colors mb-6"
                >
                  Have a rental business? We&apos;d love to list it here →
                </button>
              )}

              {!user && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <button onClick={() => router.push('/auth')} className="btn-ghost px-5 py-2.5 font-bold border border-border rounded-xl">
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth?tab=signup&role=COMPANY')}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary font-bold transition-colors"
                  >
                    List your company with us
                  </button>
                </div>
              )}
            </motion.div>

            {/* Right side: Premium overlapping images of Cars & Hotels */}
            <motion.div
              className="lg:col-span-5 relative w-full h-[400px] md:h-[450px] lg:h-[500px] flex items-center justify-center"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Backglow decoration */}
              <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-primary-500/20 to-secondary-500/20 blur-3xl rounded-full opacity-60 dark:opacity-40 -z-10" />

              {/* Main image: Luxury Car */}
              <div className="absolute top-4 left-4 w-[75%] h-[60%] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl group transition-transform duration-500 hover:scale-[1.02]">
                <Image
                  src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                  alt="Luxury rental car"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5">
                  🚗 Premium Fleets
                </div>
              </div>

              {/* Overlapping image: Luxury Room */}
              <div className="absolute bottom-4 right-4 w-[70%] h-[55%] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl group transition-transform duration-500 hover:scale-[1.02]">
                <Image
                  src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"
                  alt="Luxury hotel room stay"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5">
                  🏨 Verified Stays
                </div>
              </div>

              {/* Floating Badge 1: Ratings */}
              <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 bg-card/90 backdrop-blur-lg border border-border rounded-2xl p-3 shadow-xl flex items-center gap-2.5 animate-float">
                <span className="text-xl">⭐</span>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">4.9/5 Rating</div>
                  <div className="text-[10px] text-slate-500 font-medium">1,200+ Trip Reviews</div>
                </div>
              </div>

              {/* Floating Badge 2: Support */}
              <div className="absolute bottom-1/3 -left-6 bg-card/90 backdrop-blur-lg border border-border rounded-2xl p-3 shadow-xl flex items-center gap-2.5 animate-float" style={{ animationDelay: '2s' }}>
                <span className="text-xl">💬</span>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">WhatsApp Booking</div>
                  <div className="text-[10px] text-slate-500 font-medium">Direct with providers</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Ad Under Hero Images */}
        <GoogleAd className="mb-2" maxWidthClass="max-w-3xl" />

        {/* Features */}
        <section className="px-6 py-6">
          <div className="container-app max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuresList.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="glass-card p-6 text-left"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.08 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        {statItems.length > 0 && (
          <motion.section
            className="px-6 pb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div className="container-app max-w-3xl mx-auto">
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 pt-4 border-t border-border">
                {statItems.map(stat => (
                  <div key={stat.label} className="text-center min-w-[100px]">
                    <div className="text-3xl font-heading font-black text-slate-900 dark:text-white">{stat.value}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-semibold mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {brands.length > 0 && (
          <section id="brands" className="px-6 py-6 border-t border-border/30">
            <div className="container-app max-w-6xl mx-auto">
              <div className="mb-4">
                <h2 className="font-heading font-black text-2xl md:text-3xl text-slate-900 dark:text-white mb-2">Popular brands</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Manufacturers currently listed on the site</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {brands.map(brand => (
                  <a
                    key={brand}
                    href="#cars"
                    className="px-4 py-2 rounded-md border border-border hover:border-primary/40 text-slate-400 hover:text-primary text-sm transition-colors"
                  >
                    {brand}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="cars" className="px-6 py-6 border-t border-border/30">
          <div className="container-app max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="font-heading font-black text-2xl md:text-3xl text-slate-900 dark:text-white mb-2">Available cars</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Hand-picked listings from our rental partners — contact them directly when you&apos;re ready</p>
              </div>
              <Link href="/marketplace" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                View All Cars →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => <CarCardSkeleton key={i} />)}
              </div>
            ) : featuredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {featuredCars.map((car, i) => <CarCard key={car.id} car={car} priority={i < 4} />)}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl border border-border">
                <p className="text-slate-400">No cars listed yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        <section id="companies" className="px-6 py-6 border-t border-border/30">
          <div className="container-app max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="font-heading font-black text-2xl md:text-3xl text-slate-900 dark:text-white mb-2">Our rental partners</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Local companies with vehicles ready for your next journey</p>
              </div>
              <Link href="/marketplace/companies?type=CAR_RENTAL" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                View All Partners →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card h-40 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : carCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {carCompanies.map(company => <CompanyCard key={company.id} company={company} />)}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl border border-border">
                <p className="text-slate-600 dark:text-slate-400">No car rental companies registered yet.</p>
              </div>
            )}
          </div>
        </section>

        <section id="hotel-partners" className="px-6 py-6 border-t border-border/30">
          <div className="container-app max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="font-heading font-black text-2xl md:text-3xl text-slate-900 dark:text-white mb-2">Hotel partners</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Comfortable stays from hotels we&apos;ve verified and approved</p>
              </div>
              <Link href="/marketplace/companies?type=HOTEL" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                View All Hotels →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card h-40 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : hotelCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {hotelCompanies.map(company => <CompanyCard key={company.id} company={company} />)}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl border border-border">
                <p className="text-slate-600 dark:text-slate-400">No hotel partners registered yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Hotels Section */}
        <section id="hotels" className="px-6 py-6 border-t border-border/30">
          <div className="container-app max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="font-heading font-black text-2xl md:text-3xl text-slate-900 dark:text-white mb-2">Featured hotel rooms</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">A few of our latest room listings — more added every week</p>
              </div>
              <Link href="/marketplace/rooms" className="btn-ghost text-sm font-semibold self-start sm:self-auto">
                Browse All Rooms →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card h-72 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : featuredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredRooms.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                  >
                  <Link href={`/marketplace/rooms/${room.id}`} className="block group">
                    <div className="glass-card glass-card-interactive overflow-hidden h-full">
                      <div className="relative h-48 bg-elevated overflow-hidden">
                        {room.images?.[0] ? (
                          <Image src={room.images[0].imageUrl} alt={room.name} fill className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No photo</div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="text-xs bg-primary text-white px-2 py-1 rounded font-medium">${room.pricePerNight}/night</span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">{room.roomType}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{room.name}</h3>
                        {room.company && <p className="text-xs text-primary mt-0.5">{room.company.name}</p>}
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{room.description}</p>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border text-xs text-slate-500 dark:text-slate-400">
                          <span>{room.capacity} guests</span>
                          <span className="text-primary font-semibold">View details</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 glass-card rounded-xl">
                <p className="text-slate-600 dark:text-slate-400 text-sm">We&apos;re adding new hotel rooms soon. Check back shortly!</p>
              </div>
            )}
          </div>
        </section>

        {(!user || (user.role === 'CUSTOMER' && user.status === 'APPROVED')) && (
          <section className="px-6 py-6 border-t border-border/30">
            <motion.div
              className="container-app max-w-2xl mx-auto text-center glass-card p-8 md:p-10"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <h2 className="font-heading font-bold text-xl md:text-2xl text-slate-900 dark:text-white mb-3">
                {user ? 'Ready to grow your business?' : 'Are you a rental company or hotel?'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                {user
                  ? 'We\'d be happy to help you list your cars or rooms. You\'ll get a dashboard to manage everything in one place.'
                  : 'Join NextTripy and reach customers looking for cars and rooms in your area. Getting started only takes a few minutes.'}
              </p>
              <button onClick={openRegisterCompany} className="btn-primary px-8 py-3 text-sm font-semibold">
                {user ? 'Register your business' : 'Get started — list your business'}
              </button>
            </motion.div>
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

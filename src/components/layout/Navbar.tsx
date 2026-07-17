'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import RegisterCompanyModal from '@/components/shared/RegisterCompanyModal'
import InstallAppButton from '@/components/shared/InstallAppButton'

interface User { id: string; email: string; role: string; status: string; fullName?: string; companyId?: string; countryId?: string }

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<number>(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [registerCompanyOpen, setRegisterCompanyOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const isPortalUser = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY' || user?.role === 'HOTEL'
  const dashboardPath = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    ? '/dashboard/admin'
    : user?.role === 'HOTEL'
      ? '/dashboard/hotel'
      : '/dashboard/company'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.data)
        const nRes = await fetch('/api/notifications', { credentials: 'include' })
        if (nRes.ok) {
          const nData = await nRes.json()
          setNotifications(nData.data?.filter((n: { isRead: boolean }) => !n.isRead).length || 0)
        }
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  useEffect(() => {
    const handler = () => setRegisterCompanyOpen(true)
    window.addEventListener('open-register-company', handler)
    return () => window.removeEventListener('open-register-company', handler)
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/')
  }

  const openRegisterCompany = () => {
    setDropOpen(false)
    setMenuOpen(false)
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
    <>
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass border-b border-border shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="container-app">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image src="/logo.png" alt="NextTripy Logo" width={40} height={40} className="object-contain rounded-xl" priority />
              <span className="font-heading font-bold text-lg leading-none block">
                <span className="text-slate-900 dark:text-white">Next</span><span className="text-blue-500">Tripy</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/#cars" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors text-sm font-semibold">Cars</Link>
              <Link href="/marketplace/rooms" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors text-sm font-semibold">Hotels</Link>
              <Link href="/#companies" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors text-sm font-semibold">Companies</Link>
              <Link href="/about" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors text-sm font-semibold">About</Link>
              <Link href="/contact" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors text-sm font-semibold">Contact</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2.5 rounded-xl border border-border bg-card/20 text-foreground hover:bg-elevated transition-all duration-300"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              )}

              <InstallAppButton variant="navbar" />

              {user?.role === 'CUSTOMER' && user.status === 'APPROVED' && (
                <button onClick={openRegisterCompany} className="btn-secondary text-sm px-4 py-2 font-semibold">
                  Register Company
                </button>
              )}

              {loading ? (
                <div className="w-20 h-8 rounded-xl bg-slate-500/10 animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-white text-xs font-semibold">
                      {user.fullName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-300 max-w-[120px] truncate">{user.fullName || user.email}</span>
                    {notifications > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">{notifications}</span>
                    )}
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {dropOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-52 glass-card p-2 z-50"
                        onMouseLeave={() => setDropOpen(false)}
                      >
                        <div className="px-3 py-2 border-b border-border mb-2">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{user.role.replace('_', ' ')}</div>
                          <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        </div>
                        {isPortalUser && (
                          <Link href={dashboardPath} onClick={() => setDropOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-primary-50 hover:text-primary transition-all">
                            <span>📊</span> Dashboard
                          </Link>
                        )}
                        {user.role === 'CUSTOMER' && user.status === 'APPROVED' && (
                          <button onClick={openRegisterCompany}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-primary-50 hover:text-primary transition-all">
                            <span>🏢</span> Register Company
                          </button>
                        )}
                        <button onClick={logout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-all font-semibold">
                          <span>🚪</span> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/auth" className="text-sm px-4 py-2 font-semibold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all">Sign In</Link>
                  <Link href="/auth?tab=signup" className="btn-primary text-sm px-4 py-2 font-semibold">Get Started</Link>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg border border-border bg-card/20 text-foreground"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              )}

              <button className="p-2 text-slate-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden glass border-t border-border overflow-hidden"
              >
                <div className="p-4 flex flex-col gap-3">
                  <Link href="/#cars" className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white text-sm py-2 font-semibold" onClick={() => setMenuOpen(false)}>Cars</Link>
                  <Link href="/marketplace/rooms" className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white text-sm py-2 font-semibold" onClick={() => setMenuOpen(false)}>Hotels</Link>
                  <Link href="/#companies" className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white text-sm py-2 font-semibold" onClick={() => setMenuOpen(false)}>Companies</Link>
                  <Link href="/about" className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white text-sm py-2 font-semibold" onClick={() => setMenuOpen(false)}>About</Link>
                  <Link href="/contact" className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white text-sm py-2 font-semibold" onClick={() => setMenuOpen(false)}>Contact</Link>
                  <InstallAppButton variant="menu" />
                  <div className="border-t border-border pt-3 flex flex-col gap-2">
                    {loading ? (
                      <div className="h-8 bg-slate-500/10 rounded-xl animate-pulse" />
                    ) : user ? (
                      <>
                        {isPortalUser && (
                          <Link href={dashboardPath} className="btn-primary text-sm font-semibold" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                        )}
                        {user.role === 'CUSTOMER' && user.status === 'APPROVED' && (
                          <button onClick={openRegisterCompany} className="btn-secondary text-sm font-semibold">Register Company</button>
                        )}
                        <button onClick={() => { logout(); setMenuOpen(false) }} className="btn-ghost text-sm text-red-500 font-semibold">Logout</button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth" className="text-sm font-semibold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:border-primary hover:text-primary transition-all text-center py-2.5 px-4" onClick={() => setMenuOpen(false)}>Sign In</Link>
                        <Link href="/auth?tab=signup" className="btn-primary text-sm font-semibold" onClick={() => setMenuOpen(false)}>Get Started</Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      <RegisterCompanyModal
        open={registerCompanyOpen}
        onClose={() => setRegisterCompanyOpen(false)}
        onSuccess={fetchUser}
        defaultCountryId={user?.countryId}
      />
    </>
  )
}

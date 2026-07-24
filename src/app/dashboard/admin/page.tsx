'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { COUNTRIES } from '@/lib/countries'
import type { AdminStats, User, Company, Car, Payment, Review, Notification, Subscription } from '@/types'

interface Room {
  id: string
  name: string
  roomType: string
  description: string
  pricePerNight: number
  capacity: number
  status: string
  company?: { name: string }
}

type AdminTab = 'stats' | 'notifications' | 'companies' | 'cars' | 'rooms' | 'payments' | 'users' | 'reviews' | 'profile'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('stats')

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [updatingBank, setUpdatingBank] = useState(false)
  const [bankDetails, setBankDetails] = useState<{ bankName: string; accountNumber: string; accountName: string } | null>(null)
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountName: '' })
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAdminCurPw, setShowAdminCurPw] = useState(false)
  const [showAdminNewPw, setShowAdminNewPw] = useState(false)
  const [showAdminConfPw, setShowAdminConfPw] = useState(false)
  const [whatsAppModal, setWhatsAppModal] = useState<{ url: string; name: string; action: string } | null>(null)

  const hasFetched = useRef(false)

  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) {
        // Not authenticated — redirect silently without showing toast (may be a normal logout)
        router.push('/auth')
        return
      }
      const meData = await meRes.json()
      if (meData.data?.roleName !== 'ADMIN' && meData.data?.roleName !== 'SUPER_ADMIN') {
        router.push('/')
        return
      }
      // Pre-fill profile form with current admin info
      setProfileForm(prev => ({
        ...prev,
        fullName: meData.data?.fullName || '',
        email: meData.data?.email || '',
      }))

      const res = await fetch('/api/admin?resource=dashboard', { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          const { stats, users, companies, cars, rooms, payments, reviews, notifications, subscriptions, bankDetails } = result.data
          setStats(stats || null)
          setUsers(users || [])
          setCompanies(companies || [])
          setCars(cars || [])
          setRooms(rooms || [])
          setPayments(payments || [])
          setReviews(reviews || [])
          setNotifications(notifications || [])
          setSubscriptions(subscriptions || [])
          setBankDetails(bankDetails || null)
          setBankForm(bankDetails || { bankName: '', accountNumber: '', accountName: '' })
        }
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      loadData()
    }
  }, [loadData])

  const handleAdminAction = async (resource: string, id: string, action: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resource, id, action }),
      })
      const data = await res.json()
      if (res.ok && data.success) {

        toast.success(`✅ Action "${action}" applied — email notification sent!`)

        if (data.whatsAppUrl) {
          // Show a proper in-page modal instead of a toast (toast links are not reliably clickable)
          const name = data.data?.name || data.data?.fullName || data.data?.email || 'User'
          setWhatsAppModal({ url: data.whatsAppUrl, name, action })
        }

        loadData() 
      } else {
        toast.error(data.error || 'Failed to execute action')
      }
    } catch (err) {
      toast.error('Error executing admin action')
    }
  }

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingBank(true)
    try {
      const res = await fetch('/api/bank-details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bankForm),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Bank details saved!')
        setBankDetails(data.data)
      } else {
        toast.error(data.error || 'Failed to save bank details')
      }
    } catch (err) {
      toast.error('Error saving bank details')
    } finally {
      setUpdatingBank(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (profileForm.newPassword && profileForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setUpdatingProfile(true)
    try {
      const body: Record<string, string> = {}
      if (profileForm.fullName) body.fullName = profileForm.fullName
      if (profileForm.email) body.email = profileForm.email
      if (profileForm.newPassword && profileForm.currentPassword) {
        body.currentPassword = profileForm.currentPassword
        body.newPassword = profileForm.newPassword
      }
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Profile updated successfully!')
        setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (err) {
      toast.error('Error updating profile')
    } finally {
      setUpdatingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="container-app py-16 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading Admin Panel...</p>
      </div>
    )
  }

  const pendingCompanies = companies.filter(c => c.status === 'PENDING')
  const pendingCars = cars.filter(c => c.status === 'PENDING')
  const pendingRooms = rooms.filter(r => r.status === 'PENDING')
  const pendingPayments = payments.filter(p => p.status === 'PENDING')
  const unreadNotifications = notifications.filter(n => !n.isRead)

  const baseCards = [
    { title: 'Total Registered Users', value: stats?.totalUsers || 0, desc: `${stats?.totalCustomers || 0} Customers` },
    { title: 'Active Partners', value: stats?.totalCompanies || 0, desc: 'Car rental & hotel companies' },
    { title: 'Vehicles Catalog', value: stats?.totalCars || 0, desc: 'Total vehicles listed' },
    { title: 'Hotel Rooms', value: (stats as AdminStats & { totalRooms?: number })?.totalRooms || 0, desc: 'Total rooms listed' },
    { title: 'Subscribed Partners', value: stats?.activeSubscriptions || 0, desc: 'Active subscription plans' },
  ]

  const revenueCards: { title: string; value: string; desc: string }[] = []
  const uniqueCurrencies = Array.from(new Set(COUNTRIES.map(c => c.currency)))

  uniqueCurrencies.forEach(currency => {
    const amount = stats?.revenueByCurrency?.[currency] || 0

    if (amount > 0 || ['PKR', 'SAR', 'USD'].includes(currency)) {
      const countryObj = COUNTRIES.find(c => c.currency === currency)
      const countryCode = countryObj?.code || 'US'
      const gateways = countryCode === 'PK'
        ? 'JazzCash, EasyPaisa & Bank Transfer'
        : countryCode === 'SA'
          ? 'STC Pay, Mada & Bank Transfer'
          : 'Stripe, PayPal & Bank Transfer'

      const currencySymbol = currency === 'PKR' ? 'Rs. ' : currency === 'USD' ? '$' : ''
      const currencySuffix = ['PKR', 'USD'].includes(currency) ? '' : ` ${currency}`

      revenueCards.push({
        title: `${currency} Earnings`,
        value: `${currencySymbol}${amount.toLocaleString()}${currencySuffix}`,
        desc: gateways
      })
    }
  })

  const statsCards = [...baseCards, ...revenueCards]

  return (
    <div className="container-app py-8">

      <div className="mb-8">
        <h1 className="font-heading font-black text-3xl text-slate-900 dark:text-white">
          Admin <span className="gradient-text">Console</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform management, approvals, moderation and financial records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-3 flex flex-col gap-2">
          {[
            { id: 'stats', label: '📊 Stats & Performance' },
            { id: 'companies', label: '🏢 Company Approvals' },
            { id: 'cars', label: '🚗 Vehicle Listings' },
            { id: 'rooms', label: '🏨 Hotel Rooms' },
            { id: 'payments', label: '💳 Payment Verification' },
            { id: 'users', label: '👥 User Management' },
            { id: 'reviews', label: '⭐ Review Moderation' },
            { id: 'profile', label: '👤 My Profile' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 border border-primary/30 text-primary dark:text-white shadow-neon-violet/10'
                  : 'glass border border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {statsCards.map((s, idx) => (
                    <div key={idx} className="glass-card p-5 border border-white/5 relative overflow-hidden">
                      <span className="text-slate-500 text-xs font-semibold block mb-1">{s.title}</span>
                      <span className="text-2xl font-black text-white block my-1">{s.value}</span>
                      <span className="text-slate-400 text-2xs block">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg mb-2">Unread Notifications</h3>
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map(notif => (
                    <div key={notif.id} className="glass-card p-5 border border-white/5 flex flex-col gap-2">
                       <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-900 dark:text-white font-semibold">{notif.title}</span>
                         <span className="text-2xs uppercase text-slate-400">{new Date(notif.createdAt).toLocaleString()}</span>
                       </div>
                       <p className="text-slate-400 text-sm">{notif.message}</p>
                       <span className="text-2xs text-slate-500">Type: {notif.type}</span>
                     </div>
                   ))
                 ) : (
                   <div className="glass-card p-12 text-center border border-white/5 text-slate-400 text-sm">
                     No unread notifications at the moment.
                   </div>
                 )}
               </motion.div>
             )}
 
             {activeTab === 'companies' && (
               <motion.div
                 key="companies"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="flex flex-col gap-4"
               >
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg mb-2">Company Management</h3>
 
                 {companies.length > 0 ? (
                   companies.map(comp => {
                     const companySub = subscriptions.find(s => s.companyId === comp.id)
                     const subStatus = companySub?.status || 'UNSUBSCRIBED'
 
                     return (
                       <div
                         key={comp.id}
                         onClick={() => {
                           const matchingUser = users.find(u => u.id === comp.userId)
                           if (matchingUser) {
                             setSelectedUser({
                               ...matchingUser,
                               company: comp
                             })
                           } else {
                             setSelectedUser({
                               id: comp.userId,
                               email: comp.email,
                               phone: comp.contactNumber,
                               roleId: '',
                               roleName: comp.companyType === 'HOTEL' ? 'HOTEL' : 'COMPANY',
                               status: comp.status,
                               emailVerified: true,
                               phoneVerified: true,
                               fullName: comp.ownerName,
                               cnicOrId: comp.cnicOrId,
                               company: comp,
                               createdAt: comp.createdAt,
                               updatedAt: comp.updatedAt
                             })
                           }
                         }}
                         className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4 cursor-pointer hover:border-primary/30 transition-all hover:shadow-neon-violet/5"
                       >
                         <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap text-slate-900 dark:text-white">
                             <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{comp.name}</h4>
                            <span className={`text-3xs px-2 py-0.5 rounded border font-semibold ${
                              comp.status === 'APPROVED' 
                                ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' 
                                : comp.status === 'PENDING'
                                  ? 'text-amber-400 border-amber-400/20 bg-amber-400/5'
                                  : 'text-red-400 border-red-400/20 bg-red-400/5'
                            }`}>
                              Account: {comp.status}
                            </span>
                            <span className={`text-3xs px-2 py-0.5 rounded border font-semibold ${
                              subStatus === 'ACTIVE' 
                                ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' 
                                : subStatus === 'PENDING'
                                  ? 'text-amber-400 border-amber-400/20 bg-amber-400/5'
                                  : 'text-rose-400 border-rose-400/20 bg-rose-400/5'
                            }`}>
                              Subscription: {subStatus}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs">Owner: {comp.ownerName} • CNIC: {comp.cnicOrId}</p>
                          <p className="text-slate-400 text-xs">
                            Phone: <a href={`tel:${comp.contactNumber}`} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">{comp.contactNumber}</a> • 
                            WhatsApp: <a href={`https://wa.me/${comp.whatsAppNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium">💬 {comp.whatsAppNumber}</a>
                          </p>
                          <p className="text-slate-500 text-xs mt-1">Address: {comp.businessAddress}</p>

                          {/* Document count badge — click card to view full documents */}
                          <div className="mt-2 flex items-center gap-2">
                            {(comp as { documents?: { docType: string; fileUrl: string }[] }).documents?.length ? (
                              <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 font-semibold">
                                📎 {(comp as { documents: { docType: string; fileUrl: string }[] }).documents.length} document{(comp as { documents: { docType: string; fileUrl: string }[] }).documents.length !== 1 ? 's' : ''} uploaded (Click to View)
                              </span>
                            ) : (
                              <span className="text-2xs text-amber-400">⚠ No documents uploaded</span>
                            )}
                          </div>

                          {(() => {
                            const code = COUNTRIES.find(c => c.name === comp.country?.name || c.code === comp.country?.code)?.code
                            const sa10 = /^[12]\d{9}$/.test(comp.licenseNumber || '')
                            const pk7 = /^\d{7}$/.test(comp.licenseNumber || '')
                            const generic = /^[A-Z0-9\-\/]{5,20}$/i.test(comp.licenseNumber || '')
                            const isValid = code === 'SA' ? sa10 : code === 'PK' ? (pk7 || generic) : generic
                            return (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-2xs text-cyan-400 font-semibold">License: {comp.licenseNumber}</span>
                                <span className={`text-3xs px-2 py-0.5 rounded border font-semibold ${
                                  isValid
                                    ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
                                    : 'text-amber-400 border-amber-400/20 bg-amber-400/5'
                                }`}>
                                  {isValid ? '✓ Format OK' : '⚠ Manual Check'}
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-2 mt-2 md:mt-0 flex-shrink-0 justify-center" onClick={e => e.stopPropagation()}>

                          {comp.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAdminAction('company', comp.id, 'approve')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-2xs font-semibold px-3 py-1.5 rounded-lg flex-1"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAdminAction('company', comp.id, 'reject')}
                                className="bg-red-500 hover:bg-red-600 text-white text-2xs font-semibold px-3 py-1.5 rounded-lg flex-1"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {comp.status === 'APPROVED' && (
                            <button
                              onClick={() => handleAdminAction('company', comp.id, 'suspend')}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-2xs font-semibold px-3 py-1.5 rounded-lg"
                            >
                              Suspend Account
                            </button>
                          )}
                          {comp.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleAdminAction('company', comp.id, 'restore')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white text-2xs font-semibold px-3 py-1.5 rounded-lg"
                            >
                              Restore Account
                            </button>
                          )}

                          {comp.status === 'APPROVED' && (
                            <div className="flex gap-2 border-t md:border-t-0 md:border-l border-white/5 pt-2 md:pt-0 md:pl-2">
                              {subStatus !== 'ACTIVE' ? (
                                <button
                                  onClick={() => handleAdminAction('company', comp.id, 'activate_sub')}
                                  className="bg-primary hover:bg-primary/80 text-white text-2xs font-semibold px-3 py-1.5 rounded-lg flex-1 whitespace-nowrap"
                                >
                                  Activate Sub
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAdminAction('company', comp.id, 'deactivate_sub')}
                                  className="bg-slate-700 hover:bg-slate-600 text-white text-2xs font-semibold px-3 py-1.5 rounded-lg flex-1 whitespace-nowrap"
                                >
                                  Deactivate Sub
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="glass-card p-12 text-center border border-white/5 text-slate-400 text-sm">
                    No company accounts found.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'cars' && (
              <motion.div
                key="cars"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg mb-2">Pending Vehicle Listings</h3>

                {pendingCars.length > 0 ? (
                  pendingCars.map(car => (
                    <div key={car.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{car.brand} {car.model} ({car.year})</h4>
                        <p className="text-slate-400 text-xs">Transmission: {car.transmission} • Fuel: {car.fuelType} • Seating: {car.seatingCapacity}</p>
                        <p className="text-slate-400 text-xs">Reg #: {car.regNumber} • Engine: {car.engineNumber} • Mileage: {car.mileage.toLocaleString()} km</p>
                        <p className="text-slate-500 text-xs mt-1">{car.description}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                        <button
                          onClick={() => handleAdminAction('car', car.id, 'approve')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAdminAction('car', car.id, 'reject')}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass-card p-12 text-center border border-white/5 text-slate-400 text-sm">
                    No car listings awaiting approval.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'rooms' && (
              <motion.div
                key="rooms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg mb-2">Hotel Room Listings</h3>

                {pendingRooms.length > 0 ? (
                  <>
                    <p className="text-amber-400 text-xs mb-1">{pendingRooms.length} room(s) awaiting approval</p>
                    {pendingRooms.map(room => (
                      <div key={room.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{room.name}</h4>
                          <p className="text-slate-400 text-xs">Type: {room.roomType} • Capacity: {room.capacity} • ${room.pricePerNight}/night</p>
                          {room.company && <p className="text-primary text-xs">Hotel: {room.company.name}</p>}
                          <p className="text-slate-500 text-xs mt-1 line-clamp-2">{room.description}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                          <button
                            onClick={() => handleAdminAction('room', room.id, 'approve')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAdminAction('room', room.id, 'reject')}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}

                <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">All Rooms ({rooms.length})</h4>
                {rooms.filter(r => r.status !== 'PENDING').length > 0 ? (
                  rooms.filter(r => r.status !== 'PENDING').map(room => (
                    <div key={room.id} className="glass-card p-4 border border-white/5 flex flex-col md:flex-row justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{room.name}</h4>
                          <span className={`text-3xs px-2 py-0.5 rounded border font-semibold ${
                            room.status === 'APPROVED' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
                            : room.status === 'REJECTED' ? 'text-red-400 border-red-400/20 bg-red-400/5'
                            : 'text-slate-400 border-slate-400/20'
                          }`}>{room.status}</span>
                        </div>
                        <p className="text-slate-400 text-xs">{room.roomType} • Cap: {room.capacity} • ${room.pricePerNight}/night</p>
                        {room.company && <p className="text-primary text-xs">{room.company.name}</p>}
                      </div>
                      {room.status === 'APPROVED' && (
                        <button
                          onClick={() => handleAdminAction('room', room.id, 'suspend')}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg self-center"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  ))
                ) : rooms.length === 0 ? (
                  <div className="glass-card p-12 text-center border border-white/5 text-slate-400 text-sm">
                    No hotel room listings yet.
                  </div>
                ) : null}
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-8"
              >

                <div className="glass-card p-6 border border-white/5">
                  <h3 className="font-heading font-bold text-white text-base mb-1">🏦 Configure Bank Transfer Account</h3>
                  <p className="text-slate-400 text-xs mb-4">Set the bank details shown to companies when they subscribe.</p>

                  <form onSubmit={handleSaveBankDetails} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-slate-400 text-2xs font-semibold mb-1 block">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Habib Bank Limited"
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        className="input w-full bg-dark-900/60 text-xs py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-2xs font-semibold mb-1 block">Account Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Platform Admin"
                        value={bankForm.accountName}
                        onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                        className="input w-full bg-dark-900/60 text-xs py-2 text-white"
                        required
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="text-slate-400 text-2xs font-semibold mb-1 block">Account / IBAN</label>
                        <input
                          type="text"
                          placeholder="e.g. PK12HABB000000000"
                          value={bankForm.accountNumber}
                          onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                          className="input w-full bg-dark-900/60 text-xs py-2 text-white"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={updatingBank}
                        className="btn-primary py-2 px-4 text-xs font-semibold shadow-neon-violet whitespace-nowrap"
                      >
                        {updatingBank ? 'Saving...' : 'Save Details'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg">Pending Subscriptions Verification</h3>

                  {pendingPayments.length > 0 ? (
                    pendingPayments.map(pay => (
                      <div key={pay.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <span className="text-2xs text-slate-500 uppercase tracking-wider block mb-1">Transaction ID: {pay.transactionId}</span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{pay.amount.toLocaleString()} {pay.currency}</h4>
                          <p className="text-slate-400 text-xs">Gateway: {pay.gateway} • Submitter info: {pay.accountDetails || '—'}</p>
                          <span className="text-slate-500 text-2xs block mt-1">Submitted on: {formatDate(pay.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                          <button
                            onClick={() => handleAdminAction('payment', pay.id, 'verify')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                          >
                            Verify & Activate
                          </button>
                          <button
                            onClick={() => handleAdminAction('payment', pay.id, 'reject')}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="glass-card p-12 text-center border border-white/5 text-slate-400 text-sm">
                      No pending subscription payments.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg mb-2">Registered Accounts</h3>

                {/* User cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map(u => {
                    const roleColors: Record<string, string> = {
                      ADMIN: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
                      SUPER_ADMIN: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
                      COMPANY: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                      HOTEL: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
                      CUSTOMER: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                    }
                    const statusColors: Record<string, string> = {
                      PENDING: 'text-amber-500 bg-amber-500/10',
                      APPROVED: 'text-emerald-500 bg-emerald-500/10',
                      REJECTED: 'text-red-500 bg-red-500/10',
                      SUSPENDED: 'text-orange-500 bg-orange-500/10',
                      BANNED: 'text-red-700 bg-red-700/10',
                    }
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="glass-card p-5 border border-white/5 hover:border-primary/30 text-left transition-all hover:shadow-neon-violet/10 hover:scale-[1.01] group"
                      >
                        {/* Avatar + name */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center text-lg font-black text-primary flex-shrink-0">
                            {(u.fullName || u.email)?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-primary transition-colors">
                              {u.fullName || '—'}
                            </h4>
                            <p className="text-slate-500 text-xs truncate">{u.email}</p>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className={`text-2xs px-2 py-0.5 rounded font-bold border ${roleColors[u.roleName] || 'text-slate-400 bg-white/5 border-white/10'}`}>
                            {u.roleName}
                          </span>
                          <span className={`text-2xs px-2 py-0.5 rounded font-bold ${statusColors[u.status] || 'text-slate-400'}`}>
                            {u.status}
                          </span>
                          {(u as User & { cnicOrId?: string }).cnicOrId === 'Pending' && (
                            <span className="text-2xs px-2 py-0.5 rounded font-bold text-yellow-600 bg-yellow-500/10">Profile Pending</span>
                          )}
                          {(u as User & { cnicOrId?: string }).cnicOrId === 'SKIPPED' && (
                            <span className="text-2xs px-2 py-0.5 rounded font-bold text-slate-500 bg-white/5">Skipped Verify</span>
                          )}
                        </div>

                        <p className="text-slate-500 text-xs">📱 {u.phone || '—'}</p>

                        {/* Actions row */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                          {u.status === 'PENDING' ? (
                            <>
                              <button onClick={() => handleAdminAction('user', u.id, 'approve')}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                                Approve
                              </button>
                              <button onClick={() => handleAdminAction('user', u.id, 'suspend')}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                                Suspend
                              </button>
                            </>
                          ) : u.status === 'APPROVED' ? (
                            <button onClick={() => handleAdminAction('user', u.id, 'suspend')}
                              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                              Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleAdminAction('user', u.id, 'restore')}
                              className="flex-1 bg-primary hover:bg-primary/80 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                              Restore
                            </button>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {users.length === 0 && (
                  <div className="glass-card p-12 text-center border border-white/5 text-slate-400 text-sm">No users found.</div>
                )}
              </motion.div>
            )}

            {/* User Details Modal */}
            {selectedUser && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="relative w-full max-w-2xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                  {/* Modal header */}
                  <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6 py-4 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center text-lg font-black text-primary">
                        {(selectedUser.fullName || selectedUser.email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base">
                          {selectedUser.fullName || selectedUser.email}
                        </h3>
                        <p className="text-slate-500 text-xs">{selectedUser.roleName} • {selectedUser.status}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Basic info */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account Info</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Full Name', value: selectedUser.fullName },
                          { label: 'Email', value: selectedUser.email },
                          { label: 'Phone', value: selectedUser.phone },
                          { label: 'Status', value: selectedUser.status },
                          { label: 'Role', value: selectedUser.roleName },
                          { label: 'Father Name', value: (selectedUser as User & { fatherName?: string }).fatherName },
                          { label: 'National ID / CNIC', value: (selectedUser as User & { cnicOrId?: string }).cnicOrId },
                          { label: 'Date of Birth', value: (selectedUser as User & { dateOfBirth?: string }).dateOfBirth },
                          { label: 'Address', value: (selectedUser as User & { address?: string }).address },
                          { label: 'Emergency Name', value: (selectedUser as User & { emergencyName?: string }).emergencyName },
                          { label: 'Emergency Phone', value: (selectedUser as User & { emergencyPhone?: string }).emergencyPhone },
                          { label: 'Registered On', value: formatDate(selectedUser.createdAt) },
                        ].map(({ label, value }) => value && value !== 'Pending' && value !== 'SKIPPED' ? (
                          <div key={label} className="glass p-3 rounded-xl border border-white/5">
                            <p className="text-slate-500 text-2xs">{label}</p>
                            <p className="text-slate-900 dark:text-white text-xs font-semibold mt-0.5 break-all">{value}</p>
                          </div>
                        ) : null)}
                      </div>
                    </div>

                    {/* Company info (if applicable) */}
                    {(selectedUser as User & { company?: { name: string; ownerName: string; cnicOrId: string; contactNumber: string; whatsAppNumber: string; businessAddress: string; licenseNumber: string; status: string; companyType?: string; documents?: { docType: string; fileUrl: string }[] } }).company && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Company Info</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Company Name', value: (selectedUser as User & { company?: { name: string } }).company?.name },
                            { label: 'Company Type', value: (selectedUser as User & { company?: { companyType?: string } }).company?.companyType },
                            { label: 'Owner Name', value: (selectedUser as User & { company?: { ownerName: string } }).company?.ownerName },
                            { label: 'Owner CNIC', value: (selectedUser as User & { company?: { cnicOrId: string } }).company?.cnicOrId },
                            { label: 'Contact', value: (selectedUser as User & { company?: { contactNumber: string } }).company?.contactNumber },
                            { label: 'WhatsApp', value: (selectedUser as User & { company?: { whatsAppNumber: string } }).company?.whatsAppNumber },
                            { label: 'Business Address', value: (selectedUser as User & { company?: { businessAddress: string } }).company?.businessAddress },
                            { label: 'License Number', value: (selectedUser as User & { company?: { licenseNumber: string } }).company?.licenseNumber },
                            { label: 'Company Status', value: (selectedUser as User & { company?: { status: string } }).company?.status },
                          ].map(({ label, value }) => value && value !== 'Pending' ? (
                            <div key={label} className="glass p-3 rounded-xl border border-white/5">
                              <p className="text-slate-500 text-2xs">{label}</p>
                              {label === 'WhatsApp' ? (
                                <a 
                                  href={`https://wa.me/${value.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-emerald-400 hover:text-emerald-300 hover:underline text-xs font-semibold mt-0.5 block break-all"
                                >
                                  💬 {value}
                                </a>
                              ) : label === 'Contact' ? (
                                <a 
                                  href={`tel:${value}`} 
                                  className="text-blue-400 hover:text-blue-300 hover:underline text-xs font-semibold mt-0.5 block break-all"
                                >
                                  📞 {value}
                                </a>
                              ) : (
                                <p className="text-slate-900 dark:text-white text-xs font-semibold mt-0.5 break-all">{value}</p>
                              )}
                            </div>
                          ) : null)}
                        </div>

                        {/* Documents */}
                        {((selectedUser as User & { company?: { documents?: { docType: string; fileUrl: string }[] } }).company?.documents?.length ?? 0) > 0 ? (
                          <div className="mt-4">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Uploaded Documents</h5>
                            <div className="grid grid-cols-3 gap-3">
                              {(selectedUser as User & { company?: { documents?: { docType: string; fileUrl: string }[] } }).company!.documents!.map(doc => (
                                <a key={doc.fileUrl} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                                  className="glass border border-white/10 rounded-xl overflow-hidden hover:border-primary/40 transition-colors group">
                                  {!doc.fileUrl.toLowerCase().endsWith('.pdf') ? (
                                    <div className="relative">
                                      <img src={doc.fileUrl} alt={doc.docType} className="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">View ↗</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-24 flex items-center justify-center bg-white/5">
                                      <span className="text-3xl">📄</span>
                                    </div>
                                  )}
                                  <p className="text-2xs text-slate-400 text-center py-2 px-1 truncate">{doc.docType.replace(/_/g, ' ')}</p>
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Uploaded Documents</h5>
                            <p className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                              ⚠ No verification documents uploaded by this company.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2 border-t border-white/5">
                      {selectedUser.status === 'PENDING' ? (
                        <>
                          <button onClick={() => { handleAdminAction('user', selectedUser.id, 'approve'); setSelectedUser(null) }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                            ✓ Approve Account
                          </button>
                          <button onClick={() => { handleAdminAction('user', selectedUser.id, 'suspend'); setSelectedUser(null) }}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                            Suspend
                          </button>
                        </>
                      ) : selectedUser.status === 'APPROVED' ? (
                        <button onClick={() => { handleAdminAction('user', selectedUser.id, 'suspend'); setSelectedUser(null) }}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                          Suspend Account
                        </button>
                      ) : (
                        <button onClick={() => { handleAdminAction('user', selectedUser.id, 'restore'); setSelectedUser(null) }}
                          className="flex-1 bg-primary hover:bg-primary/80 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                          Restore Account
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg mb-2">Reviews Moderation</h3>

                {reviews.map(rev => (
                  <div key={rev.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Company ID: {rev.companyId}</h4>
                      <p className="text-slate-400 text-xs">Rating: {rev.rating} ★ • Comment: &quot;{rev.comment}&quot;</p>
                      <p className="text-slate-500 text-xs">Visible on profile: {rev.isVisible ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                      {rev.isVisible ? (
                        <button
                          onClick={() => handleAdminAction('review', rev.id, 'hide')}
                          className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Hide Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAdminAction('review', rev.id, 'show')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Show Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg mb-2">👤 Profile Management</h3>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                  {/* Update Info */}
                  <div className="glass-card p-6 border border-white/5">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center text-xs">✏️</span>
                      Update Profile Info
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={e => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="admin@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="glass-card p-6 border border-white/5">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">🔒</span>
                      Change Password
                    </h4>
                    <p className="text-slate-500 text-xs mb-4">Leave password fields blank if you only want to update your name or email.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1.5">Current Password</label>
                        <div className="relative">
                          <input
                            type={showAdminCurPw ? 'text' : 'password'}
                            value={profileForm.currentPassword}
                            onChange={e => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors pr-10"
                            placeholder="••••••••"
                          />
                          <button type="button" onClick={() => setShowAdminCurPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm select-none">
                            {showAdminCurPw ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1.5">New Password</label>
                        <div className="relative">
                          <input
                            type={showAdminNewPw ? 'text' : 'password'}
                            value={profileForm.newPassword}
                            onChange={e => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors pr-10"
                            placeholder="Min 8 characters"
                          />
                          <button type="button" onClick={() => setShowAdminNewPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm select-none">
                            {showAdminNewPw ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1.5">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showAdminConfPw ? 'text' : 'password'}
                            value={profileForm.confirmPassword}
                            onChange={e => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors pr-10"
                            placeholder="Repeat new password"
                          />
                          <button type="button" onClick={() => setShowAdminConfPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm select-none">
                            {showAdminConfPw ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className="btn-primary px-8 py-2.5 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updatingProfile ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── WhatsApp Notification Modal ───────────────────────── */}
      <AnimatePresence>
        {whatsAppModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setWhatsAppModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-card border border-emerald-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl">💬</div>
                <div>
                  <h3 className="font-bold text-white text-base">Send WhatsApp Message</h3>
                  <p className="text-slate-400 text-xs">Notify via WhatsApp — action: <span className="text-emerald-400 font-semibold">{whatsAppModal.action}</span></p>
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-5">
                Click <strong className="text-white">Send Message</strong> to open WhatsApp with a pre-written notification for <span className="text-emerald-400 font-semibold">{whatsAppModal.name}</span>.
              </p>

              <div className="flex gap-3">
                <a
                  href={whatsAppModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsAppModal(null)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Send Message
                </a>
                <button
                  onClick={() => setWhatsAppModal(null)}
                  className="px-4 py-3 rounded-xl glass border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all text-sm font-semibold"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

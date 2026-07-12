'use client'
import { useState, useEffect } from 'react'
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

type AdminTab = 'stats' | 'notifications' | 'companies' | 'cars' | 'rooms' | 'payments' | 'users' | 'reviews'

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

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) {
        toast.error('Session expired')
        router.push('/auth')
        return
      }
      const meData = await meRes.json()
      if (meData.data?.roleName !== 'ADMIN' && meData.data?.roleName !== 'SUPER_ADMIN') {
        toast.error('Unauthorized access')
        router.push('/')
        return
      }

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
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
          toast(
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-white">📱 Send WhatsApp Notification</p>
              <p className="text-xs text-slate-400">Tap below to send a pre-written WhatsApp message to the user/company.</p>
              <a
                href={data.whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                💬 Open WhatsApp
              </a>
            </div>,
            { duration: 12000, id: `wa-${id}` }
          )
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
        <h1 className="font-heading font-black text-3xl text-white">
          Admin <span className="gradient-text">Console</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform management, approvals, moderation and financial records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-3 flex flex-col gap-2">
          {[
            { id: 'stats', label: '📊 Stats & Performance', badge: 0 },
            { id: 'companies', label: '🏢 Company Approvals', badge: pendingCompanies.length },
            { id: 'cars', label: '🚗 Vehicle Listings', badge: pendingCars.length },
            { id: 'rooms', label: '🏨 Hotel Rooms', badge: pendingRooms.length },
            { id: 'payments', label: '💳 Payment Verification', badge: pendingPayments.length },
            { id: 'users', label: '👥 User Management', badge: 0 },
            { id: 'reviews', label: '⭐ Review Moderation', badge: 0 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-between ${
                activeTab === tab.id
                  ? 'bg-primary/10 border border-primary/30 text-white shadow-neon-violet/10'
                  : 'glass border border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="bg-primary text-white text-2xs font-bold px-2 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
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
                <h3 className="font-heading font-bold text-white text-lg mb-2">Unread Notifications</h3>
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map(notif => (
                    <div key={notif.id} className="glass-card p-5 border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-white font-semibold">{notif.title}</span>
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
                <h3 className="font-heading font-bold text-white text-lg mb-2">Company Management</h3>

                {companies.length > 0 ? (
                  companies.map(comp => {
                    const companySub = subscriptions.find(s => s.companyId === comp.id)
                    const subStatus = companySub?.status || 'UNSUBSCRIBED'

                    return (
                      <div key={comp.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap text-white">
                            <h4 className="font-bold text-sm">{comp.name}</h4>
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
                          <p className="text-slate-400 text-xs">Phone: {comp.contactNumber} • WhatsApp: {comp.whatsAppNumber}</p>
                          <p className="text-slate-500 text-xs mt-1">Address: {comp.businessAddress}</p>

                          {(comp as { documents?: { docType: string; fileUrl: string }[] }).documents?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(comp as { documents: { docType: string; fileUrl: string }[] }).documents.map(doc => (
                                <a
                                  key={`${comp.id}-${doc.docType}`}
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-2xs px-2 py-1 rounded border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 hover:bg-cyan-400/10 transition-colors"
                                >
                                  📎 {doc.docType.replace(/_/g, ' ')}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-2xs text-amber-400 mt-2">No verification documents uploaded</p>
                          )}

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
                        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-2 mt-2 md:mt-0 flex-shrink-0 justify-center">

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
                <h3 className="font-heading font-bold text-white text-lg mb-2">Pending Vehicle Listings</h3>

                {pendingCars.length > 0 ? (
                  pendingCars.map(car => (
                    <div key={car.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white text-sm mb-1">{car.brand} {car.model} ({car.year})</h4>
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
                <h3 className="font-heading font-bold text-white text-lg mb-2">Hotel Room Listings</h3>

                {pendingRooms.length > 0 ? (
                  <>
                    <p className="text-amber-400 text-xs mb-1">{pendingRooms.length} room(s) awaiting approval</p>
                    {pendingRooms.map(room => (
                      <div key={room.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-white text-sm mb-1">{room.name}</h4>
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

                <h4 className="font-bold text-white text-sm mt-2">All Rooms ({rooms.length})</h4>
                {rooms.filter(r => r.status !== 'PENDING').length > 0 ? (
                  rooms.filter(r => r.status !== 'PENDING').map(room => (
                    <div key={room.id} className="glass-card p-4 border border-white/5 flex flex-col md:flex-row justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-white text-sm">{room.name}</h4>
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
                  <h3 className="font-heading font-bold text-white text-lg">Pending Subscriptions Verification</h3>

                  {pendingPayments.length > 0 ? (
                    pendingPayments.map(pay => (
                      <div key={pay.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <span className="text-2xs text-slate-500 uppercase tracking-wider block mb-1">Transaction ID: {pay.transactionId}</span>
                          <h4 className="font-bold text-white text-sm mb-1">{pay.amount.toLocaleString()} {pay.currency}</h4>
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
                <h3 className="font-heading font-bold text-white text-lg mb-2">Registered Accounts</h3>

                {users.map(u => (
                  <div key={u.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{u.fullName || 'No Name'}</h4>
                      <p className="text-slate-400 text-xs">{u.email} • Role: {u.roleName} • Status: {u.status}</p>
                      <p className="text-slate-500 text-xs">Phone: {u.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                      {u.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleAdminAction('user', u.id, 'approve')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAdminAction('user', u.id, 'suspend')}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                          >
                            Suspend
                          </button>
                        </>
                      ) : u.status === 'APPROVED' ? (
                        <button
                          onClick={() => handleAdminAction('user', u.id, 'suspend')}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAdminAction('user', u.id, 'restore')}
                          className="bg-primary hover:bg-primary/80 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <h3 className="font-heading font-bold text-white text-lg mb-2">Reviews Moderation</h3>

                {reviews.map(rev => (
                  <div key={rev.id} className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">Company ID: {rev.companyId}</h4>
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
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

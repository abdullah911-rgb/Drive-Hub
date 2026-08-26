'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/ui'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { getPaymentGateways, formatDate } from '@/lib/utils'
import { convertPKR, formatSubscriptionPrice, formatMoney, toMoneyNumber } from '@/lib/currency'
import { SUBSCRIPTION_BASE_PKR } from '@/lib/subscription'
import type { Company, Subscription } from '@/types'

interface Room {
  id: string
  name: string
  roomType: string
  description: string
  pricePerNight: number
  capacity: number
  floor?: string
  amenities?: string[]
  status: string
  images?: { id: string; imageUrl: string; isPrimary?: boolean }[]
}

const ROOM_TYPES = ['STANDARD', 'DELUXE', 'STUDIO', 'FAMILY']
const AMENITIES_LIST = ['WiFi', 'AC', 'TV', 'Minibar', 'Balcony', 'Ocean View', 'Jacuzzi', 'Kitchen', 'Gym Access', 'Breakfast Included']

const EMPTY_ROOM = {
  name: '',
  roomType: 'STANDARD',
  description: '',
  pricePerNight: '',
  capacity: '2',
  floor: '',
  amenitiesInput: '',
}

export default function HotelDashboardClient() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [bankDetails, setBankDetails] = useState<{ bankName: string; accountNumber: string; accountName: string } | null>(null)

  const [activeTab, setActiveTab] = useState<'listings' | 'subscription'>('listings')

  const [showAddRoomModal, setShowAddRoomModal] = useState(false)
  const [submittingRoom, setSubmittingRoom] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<{ dataUrl: string; name: string }[]>([])
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [accountDetails, setAccountDetails] = useState('')

  const [planPrice, setPlanPrice] = useState(formatSubscriptionPrice(SUBSCRIPTION_BASE_PKR, 'PKR'))

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) {
        toast.error('Session expired')
        router.push('/auth')
        return
      }

      const userData = await res.json()
      if (!userData.data) {
        toast.error('Session expired')
        router.push('/auth')
        return
      }
      if (userData.data.roleName !== 'HOTEL') {
        toast.error('Unauthorized access')
        router.push('/')
        return
      }

      if (userData.data?.cnicOrId === 'Pending') {
        router.push('/visit')
        return
      }

      if (userData.data.companyId) {
        const companyRes = await fetch(`/api/companies/${userData.data.companyId}`, { credentials: 'include' })
        if (companyRes.ok) {
          const compData = await companyRes.json()
          setCompany(compData.data)
          setSubscription(compData.data?.subscriptions?.[0] || null)
        }

        const roomsRes = await fetch(`/api/rooms?companyId=${userData.data.companyId}`, { credentials: 'include' })
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json()
          setRooms(roomsData.data || [])
        }
      }

      const bankRes = await fetch('/api/bank-details', { credentials: 'include' })
      if (bankRes.ok) {
        const bankData = await bankRes.json()
        setBankDetails(bankData.data)
      }

    } catch (err) {
      console.error('Error fetching hotel dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    if (!company) return
    const resolvePrice = async () => {
      const currCode = (company as Company & { country?: { currency: string } }).country?.currency || 'PKR'
      const { amount } = await convertPKR(SUBSCRIPTION_BASE_PKR, currCode)
      setPlanPrice(formatSubscriptionPrice(amount, currCode))
    }
    resolvePrice()
  }, [company])

  const handleOpenAddModal = () => {
    setEditingRoomId(null)
    setUploadedImages([])
    setRoomForm(EMPTY_ROOM)
    setSelectedAmenities([])
    setShowAddRoomModal(true)
  }

  const handleOpenEditModal = (room: Room) => {
    setEditingRoomId(room.id)
    const existingImgs = room.images ? room.images.map(img => ({ dataUrl: img.imageUrl, name: 'existing' })) : []
    setUploadedImages(existingImgs)
    setRoomForm({
      name: room.name,
      roomType: room.roomType,
      description: room.description,
      pricePerNight: toMoneyNumber(room.pricePerNight).toString(),
      capacity: room.capacity.toString(),
      floor: room.floor || '',
      amenitiesInput: '',
    })
    setSelectedAmenities(room.amenities || [])
    setShowAddRoomModal(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (uploadedImages.length + files.length > 2) {
      toast.error('Maximum 2 images allowed per room')
      return
    }
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string
        setUploadedImages(prev => {
          if (prev.length >= 2) return prev
          return [...prev, { dataUrl, name: file.name }]
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (idx: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== idx))
  }

  const toggleAmenity = (a: string) => {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    const { name, description, pricePerNight, capacity } = roomForm
    if (!name || !description || !pricePerNight || !capacity) {
      toast.error('Please fill in all required fields')
      return
    }
    if (!subscription || subscription.status !== 'ACTIVE') {
      toast.error('An active subscription is required to list rooms')
      return
    }
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least 1 image of the room')
      return
    }

    setSubmittingRoom(true)
    try {
      const amenitiesFromInput = roomForm.amenitiesInput.split(',').map(a => a.trim()).filter(Boolean)
      const allAmenities = [...new Set([...selectedAmenities, ...amenitiesFromInput])]

      const imagesPayload = uploadedImages.map((img, idx) => ({
        id: `img-${idx}-${Date.now()}`,
        imageUrl: img.dataUrl,
        imageType: idx === 0 ? 'MAIN' : 'SECONDARY',
        isPrimary: idx === 0,
      }))

      const url = editingRoomId ? `/api/rooms/${editingRoomId}` : '/api/rooms'
      const method = editingRoomId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...roomForm,
          pricePerNight: parseFloat(roomForm.pricePerNight),
          capacity: parseInt(roomForm.capacity),
          amenities: allAmenities,
          images: imagesPayload,
          status: 'APPROVED',
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(editingRoomId ? 'Room updated successfully!' : 'Room listed and live on the marketplace!')
        setShowAddRoomModal(false)
        setEditingRoomId(null)
        setUploadedImages([])
        setRoomForm(EMPTY_ROOM)
        setSelectedAmenities([])
        fetchDashboardData()
      } else {
        toast.error(data.error || 'Failed to submit room')
      }
    } catch {
      toast.error('Error saving room')
    } finally {
      setSubmittingRoom(false)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Delete this room listing?')) return
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        toast.success('Room deleted')
        fetchDashboardData()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Error deleting room')
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGateway) { toast.error('Please select a payment gateway'); return }
    if (!transactionId.trim()) { toast.error('Please enter the Transaction ID'); return }
    setSubmittingPayment(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway: selectedGateway, transactionId, accountDetails, receiptUrl: '' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Subscription payment submitted! Awaiting verification.')
        setTransactionId('')
        setAccountDetails('')
        fetchDashboardData()
      } else {
        toast.error(data.error || 'Subscription submission failed')
      }
    } catch {
      toast.error('Error submitting payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="container-app py-16 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading Hotel Dashboard...</p>
      </div>
    )
  }

  if (!company) return null

  const countryCode = (company as Company & { country?: { code: string } }).country?.code || 'US'
  const paymentGateways = getPaymentGateways(countryCode)
  const hasActiveSub = subscription?.status === 'ACTIVE'
  const approvedRooms = rooms.filter(r => r.status === 'APPROVED').length
  const currencyCode = (company as Company & { country?: { currency?: string } } | null)?.country?.currency || 'PKR'

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 dark:text-white">
            Hotel <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{company.name} • Manage rooms and subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={company.status} />
          {subscription ? (
            <span className={`text-2xs px-2.5 py-1 rounded-md border font-bold ${
              subscription.status === 'ACTIVE'
                ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20'
                : subscription.status === 'PENDING'
                  ? 'text-amber-400 bg-amber-400/5 border-amber-400/20'
                  : 'text-rose-400 bg-rose-400/5 border-rose-400/20'
            }`}>
              {subscription.status === 'ACTIVE' ? 'Subscribed' : subscription.status === 'PENDING' ? 'Subscription Pending' : `Subscription ${subscription.status}`}
            </span>
          ) : (
            <span className="text-2xs text-red-400 bg-red-400/5 px-2.5 py-1 rounded-md border border-red-400/20 font-bold">Unsubscribed</span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Rooms', value: rooms.length, icon: '🛏️', color: 'text-primary' },
          { label: 'Live', value: approvedRooms, icon: '✅', color: 'text-emerald-400' },
          { label: 'Hidden / Other', value: rooms.length - approvedRooms, icon: '📋', color: 'text-amber-400' },
          { label: 'Subscription', value: hasActiveSub ? 'Active' : 'Inactive', icon: '💎', color: hasActiveSub ? 'text-emerald-400' : 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="glass-card no-card-hover p-4">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`font-bold text-xl ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('listings')}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-between ${
              activeTab === 'listings'
                ? 'bg-primary/10 border border-primary/30 text-primary dark:text-white shadow-neon-violet/10'
                : 'glass border border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🏨 My Rooms ({rooms.length})</span>
            <span>→</span>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-between ${
              activeTab === 'subscription'
                ? 'bg-primary/10 border border-primary/30 text-primary dark:text-white shadow-neon-violet/10'
                : 'glass border border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>💳 Subscription</span>
            <span>→</span>
          </button>

          {/* Hotel Info Card */}
          <div className="glass-card no-card-hover p-4 mt-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Hotel Info</h3>
            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div><span className="text-slate-700 dark:text-slate-300 font-medium">Name:</span> {company.name}</div>
              <div><span className="text-slate-700 dark:text-slate-300 font-medium">Owner:</span> {company.ownerName}</div>
              <div><span className="text-slate-700 dark:text-slate-300 font-medium">Contact:</span> {company.contactNumber}</div>
              <div><span className="text-slate-700 dark:text-slate-300 font-medium">Address:</span> {company.businessAddress}</div>
              <div>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Status: </span>
                <span className={company.status === 'APPROVED' ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}>{company.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">

            {/* Rooms Listings Tab */}
            {activeTab === 'listings' && (
              <motion.div
                key="listings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">Room Listings</h2>
                  <button
                    onClick={handleOpenAddModal}
                    disabled={!hasActiveSub}
                    className="btn-primary px-4 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!hasActiveSub ? 'Active subscription required' : ''}
                  >
                    + Add Room
                  </button>
                </div>

                {!hasActiveSub && (
                  <div className="glass rounded-xl p-4 border border-amber-400/20 text-amber-400 text-sm mb-5">
                    ⚠️ You need an active subscription to add room listings.{' '}
                    <button onClick={() => setActiveTab('subscription')} className="underline font-bold">Subscribe now →</button>
                  </div>
                )}

                {rooms.length === 0 ? (
                  <div className="glass-card no-card-hover p-12 text-center">
                    <div className="text-5xl mb-4">🛏️</div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">No rooms listed yet</h3>
                    <p className="text-slate-400 text-sm mb-4">Add your first room listing to get started</p>
                    {hasActiveSub && (
                      <button onClick={handleOpenAddModal} className="btn-primary px-5 py-2">Add First Room</button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {rooms.map(room => (
                      <div key={room.id} className="glass-card no-card-hover p-4 flex flex-col md:flex-row gap-4">
                        {/* Image */}
                        <div className="relative w-full md:w-32 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          {room.images?.[0] ? (
                            <Image src={room.images[0].imageUrl} alt={room.name} fill sizes="128px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">🛏️</div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{room.name}</h4>
                              <p className="text-xs text-slate-400">{room.roomType} • Capacity: {room.capacity}</p>
                            </div>
                            <span className={`text-2xs px-2 py-0.5 rounded font-bold border ${
                              room.status === 'APPROVED' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                              room.status === 'PENDING' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' :
                              'text-red-400 border-red-400/20 bg-red-400/5'
                            }`}>{room.status}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{room.description}</p>
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {room.amenities.slice(0, 4).map(a => (
                                <span key={a} className="text-2xs bg-white/5 text-slate-300 px-1.5 py-0.5 rounded">{a}</span>
                              ))}
                              {room.amenities.length > 4 && (
                                <span className="text-2xs text-slate-500">+{room.amenities.length - 4} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Price & Actions */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{formatMoney(room.pricePerNight, currencyCode)}</div>
                            <div className="text-xs text-slate-400">per night</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditModal(room)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-150 font-medium"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/15 hover:border-red-400/40 transition-all duration-150 font-medium"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-5">Subscription Management</h2>

                {/* Plan Card */}
                <div className="glass-card no-card-hover p-6 border border-primary/20 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-primary text-2xl mb-2">💎</div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">Hotel Partner Plan</h3>
                      <p className="text-slate-400 text-sm mt-1">Monthly subscription to list rooms on the marketplace</p>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-2xl text-slate-900 dark:text-white">{planPrice}</div>
                      <div className="text-xs text-slate-400">per month</div>
                    </div>
                  </div>

                  {subscription && (
                    <div className={`mt-4 p-3 rounded-lg text-sm border ${
                      subscription.status === 'ACTIVE' ? 'bg-emerald-400/5 border-emerald-400/20 text-emerald-300'
                      : subscription.status === 'PENDING' ? 'bg-amber-400/5 border-amber-400/20 text-amber-300'
                      : 'bg-red-400/5 border-red-400/20 text-red-300'
                    }`}>
                      <div className="font-bold">Status: {subscription.status}</div>
                      {(subscription as Subscription & { expiresAt?: string }).expiresAt && (
                        <div className="text-xs mt-1">Expires: {formatDate((subscription as Subscription & { expiresAt?: string }).expiresAt!)}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bank Details */}
                {bankDetails && (
                  <div className="glass-card no-card-hover p-5 border border-white/5 mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">💳 Payment Instructions</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bank</span>
                        <span className="text-slate-900 dark:text-white font-medium">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account Name</span>
                        <span className="text-slate-900 dark:text-white font-medium">{bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account Number</span>
                        <span className="text-primary font-bold tracking-wider">{bankDetails.accountNumber}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Transfer {planPrice} and enter the transaction ID below</p>
                  </div>
                )}

                {/* Payment Form */}
                {(!subscription || subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED') && (
                  <form onSubmit={handlePayment} className="glass-card no-card-hover p-5 space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Submit Subscription Payment</h3>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Payment Gateway</label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentGateways.map(gw => (
                          <button
                            key={gw.id}
                            type="button"
                            onClick={() => setSelectedGateway(gw.id)}
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                              selectedGateway === gw.id
                                ? 'border-primary/50 bg-primary/10 text-primary'
                                : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {gw.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Transaction ID *</label>
                      <input
                        className="input-field text-sm"
                        placeholder="Enter transaction ID from payment"
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Account Details (optional)</label>
                      <input
                        className="input-field text-sm"
                        placeholder="Your account number used for payment"
                        value={accountDetails}
                        onChange={e => setAccountDetails(e.target.value)}
                      />
                    </div>

                    <button type="submit" disabled={submittingPayment} className="btn-primary w-full py-2.5 font-bold text-sm">
                      {submittingPayment ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : 'Submit Payment'}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Add/Edit Room Modal */}
      <AnimatePresence>
        {showAddRoomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAddRoomModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="glass-card no-card-hover w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 border border-border shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                    {editingRoomId ? 'Edit Room' : 'Add New Room'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Maximum 2 photos per room</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="btn-icon p-2 rounded-lg text-slate-400"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddRoom} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Room Photos (max 2) *</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-20 rounded-lg overflow-hidden border border-white/10 group">
                        <Image src={img.dataUrl} alt="" fill className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 text-white text-xs font-bold transition-opacity"
                        >
                          ✕ Remove
                        </button>
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 text-2xs bg-primary/90 text-white px-1 py-0.5 rounded">Main</span>
                        )}
                      </div>
                    ))}
                    {uploadedImages.length < 2 && (
                      <label className="w-24 h-20 rounded-lg border-2 border-dashed border-white/20 hover:border-primary/40 flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <span className="text-xl text-slate-500">+</span>
                        <span className="text-2xs text-slate-500">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} multiple />
                      </label>
                    )}
                  </div>
                </div>

                {/* Room Name */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Room Name *</label>
                  <input
                    className="input-field text-sm"
                    placeholder="e.g. Deluxe Ocean View Room"
                    value={roomForm.name}
                    onChange={e => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Room Type & Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Room Type *</label>
                    <SearchableSelect
                      value={roomForm.roomType}
                      onChange={v => setRoomForm(prev => ({ ...prev, roomType: v }))}
                      placeholder="Select Room Type"
                      options={ROOM_TYPES.map(t => ({
                        value: t,
                        label: t,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Capacity *</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      placeholder="2"
                      min="1"
                      max="20"
                      value={roomForm.capacity}
                      onChange={e => setRoomForm(prev => ({ ...prev, capacity: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Price & Floor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Price Per Night ({currencyCode}) *</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      placeholder={currencyCode === 'PKR' ? 'e.g. 5000' : currencyCode === 'USD' ? 'e.g. 99' : 'e.g. 250'}
                      min="1"
                      step={currencyCode === 'PKR' ? '1' : '0.01'}
                      value={roomForm.pricePerNight}
                      onChange={e => setRoomForm(prev => ({ ...prev, pricePerNight: e.target.value }))}
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Enter the nightly rate in {currencyCode} (your hotel country currency).</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Floor / Level</label>
                    <input
                      className="input-field text-sm"
                      placeholder="e.g. 3rd Floor"
                      value={roomForm.floor}
                      onChange={e => setRoomForm(prev => ({ ...prev, floor: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Amenities</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {AMENITIES_LIST.map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={`text-2xs px-2 py-1 rounded-lg border transition-all ${
                          selectedAmenities.includes(a)
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input-field text-sm"
                    placeholder="Other amenities (comma separated)"
                    value={roomForm.amenitiesInput}
                    onChange={e => setRoomForm(prev => ({ ...prev, amenitiesInput: e.target.value }))}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Description *</label>
                  <textarea
                    className="input-field text-sm h-20 resize-none"
                    placeholder="Describe the room, its views, unique features..."
                    value={roomForm.description}
                    onChange={e => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" disabled={submittingRoom} className="btn-primary w-full py-3 font-bold">
                  {submittingRoom ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editingRoomId ? 'Update Room' : 'Submit Room Listing'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

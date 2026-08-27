'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/ui'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { getPaymentGateways, formatDate } from '@/lib/utils'
import { convertPKR, formatSubscriptionPrice } from '@/lib/currency'
import { SUBSCRIPTION_BASE_PKR } from '@/lib/subscription'
import type { Company, Car, Subscription } from '@/types'

export default function CompanyDashboard() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [bankDetails, setBankDetails] = useState<{ bankName: string; accountNumber: string; accountName: string } | null>(null)

  const [activeTab, setActiveTab] = useState<'listings' | 'subscription'>('listings')

  const [showAddCarModal, setShowAddCarModal] = useState(false)
  const [submittingCar, setSubmittingCar] = useState(false)
  const [editingCarId, setEditingCarId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<{ dataUrl: string; name: string }[]>([])
  const [carForm, setCarForm] = useState({
    brand: '', model: '', year: new Date().getFullYear().toString(),
    color: '', regNumber: '', engineNumber: '', mileage: '',
    fuelType: 'PETROL', seatingCapacity: '5', transmission: 'AUTOMATIC',
    description: '', featuresInput: '',
  })

  const handleOpenAddModal = () => {
    setEditingCarId(null)
    setUploadedImages([])
    setCarForm({
      brand: '', model: '', year: new Date().getFullYear().toString(),
      color: '', regNumber: '', engineNumber: '', mileage: '',
      fuelType: 'PETROL', seatingCapacity: '5', transmission: 'AUTOMATIC',
      description: '', featuresInput: '',
    })
    setShowAddCarModal(true)
  }

  const handleOpenEditModal = (car: Car) => {
    setEditingCarId(car.id)
    // Prefill existing images as preview entries from stored URLs
    const existingImgs = car.images
      ? car.images.map(img => ({ dataUrl: img.imageUrl, name: 'existing' }))
      : []
    setUploadedImages(existingImgs)
    setCarForm({
      brand: car.brand,
      model: car.model,
      year: car.year.toString(),
      color: car.color,
      regNumber: car.regNumber,
      engineNumber: car.engineNumber,
      mileage: car.mileage.toString(),
      fuelType: car.fuelType,
      seatingCapacity: car.seatingCapacity.toString(),
      transmission: car.transmission,
      description: car.description,
      featuresInput: car.features ? car.features.join(', ') : '',
    })
    setShowAddCarModal(true)
  }

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
      if (userData.data.roleName !== 'COMPANY') {
        toast.error('Unauthorized access')
        router.push('/')
        return
      }

      if (userData.data?.cnicOrId === 'Pending') {
        router.push('/visit')
        return
      }

      const companyRes = await fetch(`/api/companies/${userData.data.companyId}`, { credentials: 'include' })
      if (companyRes.ok) {
        const compData = await companyRes.json()
        setCompany(compData.data)
        setCars(compData.data?.cars || [])
        setSubscription(compData.data?.subscriptions?.[0] || null)
      }

      const bankRes = await fetch('/api/bank-details', { credentials: 'include' })
      if (bankRes.ok) {
        const bankData = await bankRes.json()
        setBankDetails(bankData.data)
      }

    } catch (err) {
      console.error('Error fetching company dashboard data:', err)
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

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault()

    const { brand, model, year, color, regNumber, engineNumber, mileage, description } = carForm
    if (!brand || !model || !year || !color || !regNumber || !engineNumber || !mileage || !description) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmittingCar(true)
    try {

      const features = carForm.featuresInput.split(',').map(f => f.trim()).filter(Boolean)

      const imagesPayload = uploadedImages.map((img, idx) => ({
        id: `img-${idx}-${Date.now()}`,
        imageUrl: img.dataUrl,
        imageType: idx === 0 ? 'FRONT' : 'INTERIOR',
        isPrimary: idx === 0,
      }))

      if (imagesPayload.length === 0) {
        imagesPayload.push({
          id: `img-default-${Date.now()}`,
          imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
          imageType: 'FRONT',
          isPrimary: true,
        })
      }

      const url = editingCarId ? `/api/cars/${editingCarId}` : '/api/cars'
      const method = editingCarId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...carForm,
          year: parseInt(carForm.year),
          mileage: parseInt(carForm.mileage),
          seatingCapacity: parseInt(carForm.seatingCapacity),
          features,
          images: imagesPayload,
          status: 'APPROVED',
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(editingCarId ? 'Vehicle details updated successfully!' : 'Vehicle listed and live on the marketplace!')
        setShowAddCarModal(false)
        setEditingCarId(null)
        setUploadedImages([])
        setCarForm({
          brand: '', model: '', year: new Date().getFullYear().toString(),
          color: '', regNumber: '', engineNumber: '', mileage: '',
          fuelType: 'PETROL', seatingCapacity: '5', transmission: 'AUTOMATIC',
          description: '', featuresInput: '',
        })
        fetchDashboardData()
      } else {
        toast.error(data.error || 'Failed to submit vehicle')
      }
    } catch (err) {
      toast.error('Error saving vehicle')
    } finally {
      setSubmittingCar(false)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGateway) {
      toast.error('Please select a payment gateway')
      return
    }
    if (!transactionId.trim()) {
      toast.error('Please enter the Transaction ID')
      return
    }

    setSubmittingPayment(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: selectedGateway,
          transactionId,
          accountDetails,
          receiptUrl: '', 
        }),
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
    } catch (err) {
      toast.error('Error submitting payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="container-app py-16 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading Company Dashboard...</p>
      </div>
    )
  }

  if (!company) return null

  const countryCode = (company as Company & { country?: { code: string } }).country?.code || 'US'
  const paymentGateways = getPaymentGateways(countryCode)

  return (
    <div className="container-app py-8">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 dark:text-white">
            Company <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{company.name} • Manage fleet and listing subscriptions.</p>
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
              {subscription.status === 'ACTIVE' 
                ? 'Subscribed' 
                : subscription.status === 'PENDING' 
                  ? 'Subscription Pending' 
                  : `Subscription ${subscription.status}`}
            </span>
          ) : (
            <span className="text-2xs text-red-400 bg-red-400/5 px-2.5 py-1 rounded-md border border-red-400/20 font-bold">
              Unsubscribed
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-3 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('listings')}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-between ${
              activeTab === 'listings'
                ? 'bg-primary/10 border border-primary/30 text-primary dark:text-white shadow-neon-violet/10'
                : 'glass border border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🚗 My Vehicles List ({cars.length})</span>
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
            <span>💳 Subscription Plan</span>
            <span>→</span>
          </button>
        </div>

        <div className="lg:col-span-9">
          {activeTab === 'listings' ? (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >

              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg">Vehicle Fleet</h3>
                {subscription?.status === 'ACTIVE' ? (
                  <button
                    onClick={handleOpenAddModal}
                    className="btn-primary text-xs px-4 py-2.5 shadow-neon-violet font-semibold"
                  >
                    + Add New Vehicle
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTab('subscription')
                      toast.info('Active subscription required to list vehicles.')
                    }}
                    className="glass px-4 py-2.5 rounded-xl border border-white/5 text-slate-400 text-xs font-semibold"
                  >
                    🔒 Subscribe to Add Vehicles
                  </button>
                )}
              </div>

              {cars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cars.map((car) => {
                    const primaryImage = car.images?.find(i => i.isPrimary) || car.images?.[0]
                    return (
                      <div
                        key={car.id}
                        onClick={() => handleOpenEditModal(car)}
                        className="glass-card overflow-hidden flex flex-col border border-white/5 cursor-pointer hover:border-primary/40 transition-all hover:scale-[1.02] duration-200"
                      >
                        <div className="relative h-40 bg-dark-800">
                          {primaryImage ? (
                            <Image src={primaryImage.imageUrl} alt={car.name} fill className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🚗</div>
                          )}
                          <div className="absolute top-2 right-2">
                            <StatusBadge status={car.status} />
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col gap-2">
                          <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm">{car.brand} {car.model}</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">{car.year} • {car.fuelType} • {car.transmission}</p>
                          <p className="text-slate-400 text-2xs leading-relaxed line-clamp-2 mt-1">{car.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="glass-card p-16 text-center border border-white/5">
                  <span className="text-5xl block mb-3">🚗</span>
                  <h4 className="text-slate-900 dark:text-white font-bold text-base mb-1">No Vehicles Listed Yet</h4>
                  <p className="text-slate-400 text-xs mb-6">Create listings for your cars so clients can discover and rent them.</p>
                  {subscription?.status === 'ACTIVE' && (
                    <button onClick={handleOpenAddModal} className="btn-primary text-xs px-6 py-2.5">
                      Add Your First Car
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8"
            >
              <div className="md:col-span-7 flex flex-col gap-6">
                <div className="glass-card p-6 border border-white/5">
                  <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-4">Subscription Overview</h3>

                  {subscription ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-slate-500 text-xs">Plan Type</span>
                        <span className="text-slate-900 dark:text-white text-sm font-semibold">
                          Lifetime Partner Plan
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-slate-500 text-xs">Verification Status</span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          subscription.status === 'ACTIVE' 
                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' 
                            : subscription.status === 'PENDING'
                              ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                              : 'text-rose-400 bg-rose-400/10 border-rose-400/30'
                        }`}>
                          {subscription.status === 'ACTIVE' 
                            ? '✓ Active & Verified' 
                            : subscription.status === 'PENDING' 
                              ? '⏳ Awaiting Admin Verification'
                              : `Subscription ${subscription.status}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-slate-500 text-xs">Active Listings</span>
                        <span className="text-slate-900 dark:text-white text-sm font-semibold">
                          {cars.length} vehicles
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-500 text-xs">Membership Duration</span>
                        <span className="text-emerald-400 text-sm font-bold flex items-center gap-1.5">
                          <span>♾️</span> Lifetime Access (Never Expires)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <span className="text-4xl block mb-2">💳</span>
                      <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1">No Active Subscription</h4>
                      <p className="text-slate-400 text-xs">Activate your lifetime subscription to start listing rental vehicles on the marketplace.</p>
                    </div>
                  )}
                </div>

                <div className="glass-card p-6 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-heading font-black text-slate-900 dark:text-white text-base">Lifetime Partner Plan</h4>
                    <span className="text-3xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Lifetime Access
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white my-3 flex items-baseline gap-2">
                    <span>{planPrice}</span>
                    <span className="text-slate-400 text-xs font-normal">one-time payment</span>
                  </div>
                  <p className="text-slate-500 text-xs">Base price: Rs. {SUBSCRIPTION_BASE_PKR.toLocaleString()} PKR (One-time activation)</p>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 flex flex-col gap-2.5 mt-4">
                    <li className="flex items-center gap-2">✓ Unlimited lifetime listings on NextTripy</li>
                    <li className="flex items-center gap-2">✓ Verified partner badge on all vehicles</li>
                    <li className="flex items-center gap-2">✓ Direct customer leads via WhatsApp</li>
                    <li className="flex items-center gap-2">✓ Dedicated company review & ratings profile</li>
                    <li className="flex items-center gap-2">✓ Zero monthly renewal or hidden fees</li>
                  </ul>
                </div>
              </div>

              <div className="md:col-span-5">
                {(!subscription || subscription.status !== 'ACTIVE') ? (
                  <div className="glass-card p-6 border border-white/5">
                    <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-4">Activate Lifetime Subscription</h3>
                    <form onSubmit={handlePayment} className="flex flex-col gap-4">

                      {bankDetails && (
                        <div className="glass p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col gap-3 mb-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            🏦 Admin Bank Transfer Details
                          </span>
                          <div className="text-2xs text-slate-400 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span>Bank Name</span>
                              <span className="text-slate-900 dark:text-white font-medium">{bankDetails.bankName}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span>Account Title</span>
                              <span className="text-slate-900 dark:text-white font-medium">{bankDetails.accountName}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span>Account / IBAN</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-900 dark:text-white font-mono font-bold select-all bg-dark-900 px-2 py-0.5 rounded border border-white/10">{bankDetails.accountNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(bankDetails.accountNumber)
                                    toast.success('Account number copied!')
                                  }}
                                  className="text-primary hover:text-white transition-all text-xs"
                                  title="Copy Account Number"
                                >
                                  📋
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-dark-900/80 border border-primary/20 text-xs text-slate-300">
                            <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1 text-2xs uppercase tracking-wider">
                              <span>📌</span>
                              <span>Payment Instructions</span>
                            </div>
                            <p className="text-slate-400 text-2xs leading-relaxed">
                              Please transfer exactly <strong className="text-white font-semibold">{planPrice}</strong> to the bank account details above. Then select your payment channel, enter the Transaction ID, and submit for admin verification.
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-slate-400 text-xs font-semibold mb-2.5 block">Select Your Payment Channel</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {paymentGateways.map(g => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setSelectedGateway(g.name)}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                selectedGateway === g.name
                                  ? 'bg-primary/20 border-primary text-white shadow-neon-violet/10 ring-1 ring-primary'
                                  : 'glass border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                              }`}
                            >
                              <div className="relative w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0 border border-white/10">
                                {g.logoUrl ? (
                                  <img src={g.logoUrl} alt={g.name} className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-sm">{g.icon}</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-semibold block truncate">{g.name}</span>
                              </div>
                              {selectedGateway === g.name && (
                                <span className="text-primary text-xs shrink-0">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Transaction ID</label>
                        <input
                          type="text"
                          placeholder="e.g. TXN-19283746"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="input w-full bg-dark-900/60"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Your Account / Phone Number (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. +92 300 1234567"
                          value={accountDetails}
                          onChange={(e) => setAccountDetails(e.target.value)}
                          className="input w-full bg-dark-900/60"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="btn-primary w-full py-2.5 text-xs font-semibold shadow-neon-violet mt-2"
                      >
                        {submittingPayment ? 'Submitting...' : 'Submit Payment'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass-card p-6 border border-emerald-500/20 bg-emerald-500/5 text-center">
                    <span className="text-2xl block mb-2">🎉</span>
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1">Active Lifetime Subscription</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Your lifetime subscription is active and verified. You have full access to add and manage car listings without any recurring renewal fees.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddCarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCarModal(false)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-dark-900 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white">
                  {editingCarId ? 'Edit / View Vehicle Details' : 'Add New Vehicle Listing'}
                </h3>
                <button onClick={() => setShowAddCarModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
              </div>

              <form onSubmit={handleAddCar} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Brand *</label>
                    <input
                      type="text"
                      placeholder="e.g. Toyota"
                      value={carForm.brand}
                      onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Model *</label>
                    <input
                      type="text"
                      placeholder="e.g. Corolla"
                      value={carForm.model}
                      onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Year *</label>
                    <input
                      type="number"
                      placeholder="e.g. 2022"
                      value={carForm.year}
                      onChange={(e) => setCarForm({ ...carForm, year: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Color *</label>
                    <input
                      type="text"
                      placeholder="e.g. White"
                      value={carForm.color}
                      onChange={(e) => setCarForm({ ...carForm, color: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Registration Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. LE-2022-839"
                      value={carForm.regNumber}
                      onChange={(e) => setCarForm({ ...carForm, regNumber: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Engine Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. ENG-928374"
                      value={carForm.engineNumber}
                      onChange={(e) => setCarForm({ ...carForm, engineNumber: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Mileage (KM) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      value={carForm.mileage}
                      onChange={(e) => setCarForm({ ...carForm, mileage: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Seating Capacity *</label>
                    <SearchableSelect
                      value={carForm.seatingCapacity}
                      onChange={(v) => setCarForm({ ...carForm, seatingCapacity: v })}
                      placeholder="Select Seating Capacity"
                      options={[
                        { value: '2', label: '2 Passengers' },
                        { value: '4', label: '4 Passengers' },
                        { value: '5', label: '5 Passengers' },
                        { value: '7', label: '7 Passengers' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Fuel Type *</label>
                    <SearchableSelect
                      value={carForm.fuelType}
                      onChange={(v) => setCarForm({ ...carForm, fuelType: v })}
                      placeholder="Select Fuel Type"
                      options={[
                        { value: 'PETROL', label: 'Petrol' },
                        { value: 'DIESEL', label: 'Diesel' },
                        { value: 'HYBRID', label: 'Hybrid' },
                        { value: 'ELECTRIC', label: 'Electric' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">Transmission *</label>
                    <SearchableSelect
                      value={carForm.transmission}
                      onChange={(v) => setCarForm({ ...carForm, transmission: v })}
                      placeholder="Select Transmission"
                      options={[
                        { value: 'AUTOMATIC', label: 'Automatic' },
                        { value: 'MANUAL', label: 'Manual' },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1 block">Vehicle Description *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your vehicle features, condition, rental pricing guidelines..."
                    value={carForm.description}
                    onChange={(e) => setCarForm({ ...carForm, description: e.target.value })}
                    className="input w-full resize-none py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1 block">Features (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Air Conditioning, Sunroof, Bluetooth, Leather Seats"
                    value={carForm.featuresInput}
                    onChange={(e) => setCarForm({ ...carForm, featuresInput: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-2 block">Vehicle Photos (max 5)</label>
                  <div
                    className="border-2 border-dashed border-white/10 rounded-xl p-4 bg-dark-900/40 hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => document.getElementById('car-image-upload')?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                      const remaining = 5 - uploadedImages.length
                      if (remaining <= 0) { toast.error('Maximum 5 images allowed'); return }
                      const toAdd = files.slice(0, remaining)
                      toAdd.forEach(file => {
                        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB limit`); return }
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setUploadedImages(prev => prev.length < 5 ? [...prev, { dataUrl: ev.target?.result as string, name: file.name }] : prev)
                        }
                        reader.readAsDataURL(file)
                      })
                    }}
                  >
                    <input
                      id="car-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        const remaining = 5 - uploadedImages.length
                        if (remaining <= 0) { toast.error('Maximum 5 images allowed'); return }
                        const toAdd = files.slice(0, remaining)
                        toAdd.forEach(file => {
                          if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB limit`); return }
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            setUploadedImages(prev => prev.length < 5 ? [...prev, { dataUrl: ev.target?.result as string, name: file.name }] : prev)
                          }
                          reader.readAsDataURL(file)
                        })
                        e.target.value = ''
                      }}
                    />
                    {uploadedImages.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <span className="text-3xl">📸</span>
                        <p className="text-slate-400 text-xs font-semibold">Click or drag & drop images here</p>
                        <p className="text-slate-600 text-2xs">JPG, PNG, WebP • Max 5MB each • Up to 5 images</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                            <Image src={img.dataUrl} alt={img.name} fill className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-3xs text-center py-0.5 font-bold">COVER</span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setUploadedImages(prev => prev.filter((_, i) => i !== idx)) }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {uploadedImages.length < 5 && (
                          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-slate-500 text-xl hover:border-primary/40 transition-all">
                            +
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-slate-600 text-2xs mt-1.5">First image will be used as the cover photo.</p>
                </div>

                <div className="flex gap-3 justify-end mt-4 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCarModal(false)}
                    className="btn-ghost text-xs px-5 py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCar}
                    className="btn-primary text-xs px-5 py-2.5 shadow-neon-violet font-semibold"
                  >
                    {submittingCar ? 'Submitting...' : editingCarId ? 'Save Changes' : 'Submit Listing'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { CarCard } from '@/components/shared/Cards'
import { RatingStars, StatusBadge } from '@/components/ui'
import { buildWhatsAppUrl, WHATSAPP_DEFAULT_MESSAGE, formatDate } from '@/lib/utils'
import type { Company, Car, Review } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CompanyDetailPage({ params }: PageProps) {
  const { id } = use(params)
  
  // State
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Review Form State
  const [submittingReview, setSubmittingReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  // Load Company and Current User
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/companies/${id}`)
      if (res.ok) {
        const resData = await res.json()
        setCompany(resData.data)
      }

      const userRes = await fetch('/api/auth/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setCurrentUser(userData.data)
      }
    } catch (err) {
      console.error('Error fetching company details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  // Post Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: id, rating, comment }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Review posted successfully!')
        setComment('')
        setRating(5)
        // Reload details
        fetchData()
      } else {
        toast.error(data.error || 'Failed to post review')
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="container-app py-16 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading Company Profile...</p>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="container-app py-16 text-center">
        <h2 className="font-heading font-bold text-white text-2xl mb-4">Company Not Found</h2>
        <p className="text-slate-400 text-sm mb-8">The company profile you are looking for does not exist or has been removed.</p>
        <Link href="/marketplace/companies" className="btn-primary px-6 py-2.5 text-xs">
          Browse Companies
        </Link>
      </div>
    )
  }

  // Ensure WhatsApp works on listings
  const enrichedCars: Car[] = (company.cars || []).map((c) => ({
    ...c,
    company: {
      ...company,
      // prevent infinite circular reference serializing issues on key operations
      cars: undefined,
      reviews: undefined,
    },
  }))

  const waUrl = buildWhatsAppUrl(company.whatsAppNumber, WHATSAPP_DEFAULT_MESSAGE)

  return (
    <div className="container-app py-8">
      {/* Back link */}
      <Link
        href="/marketplace/companies"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold mb-6 transition-colors"
      >
        <span>←</span> Back to Companies
      </Link>

      {/* Profile Header */}
      <div className="glass-card p-6 md:p-8 border border-white/5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl shadow-neon-violet">
              {company.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-heading font-black text-2xl text-white">{company.name}</h1>
                <StatusBadge status={company.status} />
              </div>
              <p className="text-slate-400 text-xs flex items-center gap-1 mb-2">
                <span>🌍</span> {company.businessAddress} • {company.country?.name}
              </p>
              <div className="flex items-center gap-4">
                <RatingStars rating={company.averageRating || 0} count={company.totalReviews || 0} />
                <span className="text-xs text-slate-500">License: {company.licenseNumber}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <a
              href={`tel:${company.contactNumber}`}
              className="btn-ghost text-xs px-4 py-2.5 flex-1 md:flex-none justify-center"
            >
              📞 Call Owner
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp text-xs px-4 py-2.5 flex-1 md:flex-none justify-center"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 mb-8">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-6 py-3 font-heading font-bold text-sm border-b-2 transition-all ${
            activeTab === 'listings'
              ? 'border-primary text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Listings ({company.totalCars || 0})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 font-heading font-bold text-sm border-b-2 transition-all ${
            activeTab === 'reviews'
              ? 'border-primary text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Customer Reviews ({company.totalReviews || 0})
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'listings' ? (
          <motion.div
            key="listings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {enrichedCars.length > 0 ? (
              enrichedCars.map((car) => <CarCard key={car.id} car={car} />)
            ) : (
              <div className="col-span-full glass-card p-12 text-center border border-white/5">
                <span className="text-5xl block mb-3">🚗</span>
                <h4 className="text-white font-bold text-base mb-1">No Active Listings</h4>
                <p className="text-slate-400 text-xs">This company has no approved rental vehicles listed right now.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Reviews List */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {company.reviews && company.reviews.length > 0 ? (
                company.reviews.map((rev) => (
                  <div key={rev.id} className="glass-card p-5 border border-white/5">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div>
                        <span className="font-bold text-slate-200 text-sm block">
                          {rev.user?.fullName || 'Anonymous Customer'}
                        </span>
                        <span className="text-slate-500 text-2xs block">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                      <RatingStars rating={rev.rating} count={0} size="sm" />
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <div className="glass-card p-12 text-center border border-white/5">
                  <span className="text-5xl block mb-3">⭐</span>
                  <h4 className="text-white font-bold text-base mb-1">No Reviews Yet</h4>
                  <p className="text-slate-400 text-xs">Be the first to share your rental experience with this company!</p>
                </div>
              )}
            </div>

            {/* Leave a Review Box */}
            <div className="lg:col-span-5 h-fit">
              {currentUser?.role === 'CUSTOMER' && currentUser?.status === 'APPROVED' ? (
                <div className="glass-card p-6 border border-white/5">
                  <h3 className="font-heading font-bold text-white text-base mb-4">Write a Review</h3>
                  <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                    {/* Stars selection */}
                    <div>
                      <label className="text-slate-400 text-xs font-semibold mb-2 block">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            className="text-2xl transition-transform hover:scale-110"
                          >
                            {star <= rating ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment text */}
                    <div>
                      <label className="text-slate-400 text-xs font-semibold mb-2 block">Comment</label>
                      <textarea
                        rows={4}
                        placeholder="Write your honest experience about their vehicles, service, and rates..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="input w-full bg-dark-900/60 resize-none py-2"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary w-full py-2.5 text-xs font-semibold"
                    >
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-card p-6 border border-white/5 bg-white/5 text-center">
                  <span className="text-xl block mb-2">🔒</span>
                  <p className="text-slate-400 text-xs">
                    Only approved registered users can submit reviews. Sign in to write a review.
                  </p>
                  <Link href="/auth" className="btn-primary mt-4 inline-block text-2xs px-4 py-2">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

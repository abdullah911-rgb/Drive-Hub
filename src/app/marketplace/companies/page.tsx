'use client'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CompanyCard } from '@/components/shared/Cards'
import { CompanyCardSkeleton } from '@/components/ui'
import { getFlagEmoji } from '@/lib/utils'
import type { Company, Country } from '@/types'

function CompaniesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // State
  const [countries, setCountries] = useState<Country[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch Countries on load
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch('/api/countries')
        if (res.ok) {
          const resData = await res.json()
          setCountries(resData.data || [])
        }
      } catch (err) {
        console.error('Error fetching countries:', err)
      }
    }
    fetchCountries()
  }, [])

  // Sync selected country with URL query param or SessionStorage
  useEffect(() => {
    if (countries.length === 0) return

    const urlCountry = searchParams.get('country')
    const sessionCountry = typeof window !== 'undefined' ? sessionStorage.getItem('selectedCountry') : null
    const countryCode = urlCountry || sessionCountry || countries[0].code

    const match = countries.find(c => c.code.toUpperCase() === countryCode.toUpperCase())
    if (match) {
      setSelectedCountry(match)
      sessionStorage.setItem('selectedCountry', match.code)
    } else {
      setSelectedCountry(countries[0])
      sessionStorage.setItem('selectedCountry', countries[0].code)
    }
  }, [countries, searchParams])

  // Fetch filtered companies
  const fetchCompanies = useCallback(async () => {
    if (!selectedCountry) return
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('countryId', selectedCountry.id)
      params.append('status', 'APPROVED')

      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/companies?${params.toString()}`)
      if (res.ok) {
        const resData = await res.json()
        setCompanies(resData.data || [])
      }
    } catch (err) {
      console.error('Error fetching companies:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCountry, searchQuery])

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCompanies()
    }, 200)
    return () => clearTimeout(delayDebounce)
  }, [fetchCompanies])

  const handleCountrySwitch = (country: Country) => {
    setSelectedCountry(country)
    sessionStorage.setItem('selectedCountry', country.code)
    router.push(`/marketplace/companies?country=${country.code}`)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
  }

  return (
    <div className="container-app py-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{getFlagEmoji(selectedCountry?.code || '')}</span>
            <div className="flex gap-1.5">
              {countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleCountrySwitch(c)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                    selectedCountry?.code === c.code
                      ? 'bg-primary border-primary text-white shadow-neon-violet'
                      : 'glass border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <h1 className="font-heading font-black text-3xl md:text-4xl text-white">
            Car Rental <span className="gradient-text">Companies</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse and connect with premium, vetted car rental companies across {selectedCountry?.name}.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search company by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pr-10 focus:border-primary/50 focus:shadow-neon-violet/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          </div>
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CompanyCardSkeleton key={i} />
          ))}
        </div>
      ) : companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card text-center p-16 flex flex-col items-center justify-center border border-white/5"
        >
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="font-heading font-bold text-white text-lg mb-2">No Companies Found</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            We couldn't find any approved rental companies matching your current filters in {selectedCountry?.name}.
          </p>
          <button
            onClick={handleResetFilters}
            className="btn-primary mt-6 text-xs px-6 py-2.5"
          >
            Reset Filters
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={
      <div className="container-app py-8 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading Companies...</p>
      </div>
    }>
      <CompaniesContent />
    </Suspense>
  )
}

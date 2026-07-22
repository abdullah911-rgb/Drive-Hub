'use client'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CarCard } from '@/components/shared/Cards'
import { CarCardSkeleton } from '@/components/ui'
import { getFlagEmoji } from '@/lib/utils'
import type { Car, Country } from '@/types'

interface City { id: string; name: string }

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedFuelType, setSelectedFuelType] = useState('')
  const [selectedTransmission, setSelectedTransmission] = useState('')
  const [selectedSeating, setSelectedSeating] = useState('')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)

  // Fetch countries
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

  // Set initial country from URL / session
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

  // Fetch cities when country changes
  useEffect(() => {
    if (!selectedCountry) return
    setSelectedCityId('')
    async function fetchCities() {
      try {
        const res = await fetch(`/api/cities?countryId=${selectedCountry!.id}&filterType=cars`)
        if (res.ok) {
          const data = await res.json()
          setCities(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching cities:', err)
      }
    }
    fetchCities()
  }, [selectedCountry])

  const fetchCars = useCallback(async () => {
    if (!selectedCountry) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('countryId', selectedCountry.id)
      params.append('status', 'APPROVED')
      params.append('limit', '100')
      params.append('lite', 'true')
      if (selectedBrand) params.append('brand', selectedBrand)
      if (selectedFuelType) params.append('fuelType', selectedFuelType)
      if (selectedTransmission) params.append('transmission', selectedTransmission)
      if (selectedSeating) params.append('seatingCapacity', selectedSeating)
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCityId) params.append('cityId', selectedCityId)
      const res = await fetch(`/api/cars?${params.toString()}`)
      if (res.ok) {
        const resData = await res.json()
        setCars(resData.data || [])
      }
    } catch (err) {
      console.error('Error fetching cars:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCountry, selectedBrand, selectedFuelType, selectedTransmission, selectedSeating, searchQuery, selectedCityId])

  useEffect(() => {
    const delayDebounce = setTimeout(() => { fetchCars() }, 200)
    return () => clearTimeout(delayDebounce)
  }, [fetchCars])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedBrand('')
    setSelectedFuelType('')
    setSelectedTransmission('')
    setSelectedSeating('')
    setSelectedCityId('')
  }

  const handleCountrySwitch = (country: Country) => {
    setSelectedCountry(country)
    sessionStorage.setItem('selectedCountry', country.code)
    router.push(`/marketplace?country=${country.code}`)
  }

  // Sidebar filter panel (shared between desktop & mobile)
  const FilterPanel = () => (
    <div className="flex flex-col gap-5">
      {/* Location / City */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Location / City</label>
        <select
          value={selectedCityId}
          onChange={(e) => setSelectedCityId(e.target.value)}
          className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white"
        >
          <option value="">All Cities</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Brand */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Brand</label>
        <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white">
          <option value="">All Brands</option>
          {['Toyota','Honda','Hyundai','Suzuki','Nissan','Kia','Ford','BMW','Mercedes','Audi','Lexus','Chevrolet','Jeep','Mitsubishi','Mazda'].map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Transmission */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Transmission</label>
        <select value={selectedTransmission} onChange={(e) => setSelectedTransmission(e.target.value)} className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white">
          <option value="">Any Transmission</option>
          <option value="AUTOMATIC">Automatic</option>
          <option value="MANUAL">Manual</option>
        </select>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Fuel Type</label>
        <select value={selectedFuelType} onChange={(e) => setSelectedFuelType(e.target.value)} className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white">
          <option value="">Any Fuel</option>
          <option value="PETROL">Petrol</option>
          <option value="DIESEL">Diesel</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ELECTRIC">Electric</option>
        </select>
      </div>

      {/* Min Seating */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Min Seating</label>
        <select value={selectedSeating} onChange={(e) => setSelectedSeating(e.target.value)} className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white">
          <option value="">Any Capacity</option>
          <option value="2">2+ Seats</option>
          <option value="4">4+ Seats</option>
          <option value="5">5+ Seats</option>
          <option value="7">7+ Seats</option>
        </select>
      </div>
    </div>
  )

  return (
    <div className="container-app py-8">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          {/* Country Dropdown */}
          <div className="relative mb-3 flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="flex items-center justify-between gap-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 hover:border-primary/50 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-white font-semibold transition-all shadow-lg min-w-[220px] text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{getFlagEmoji(selectedCountry?.code || '')}</span>
                  <span className="text-slate-800 dark:text-white">{selectedCountry?.name || 'Select Country'}</span>
                  <span className="text-2xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono uppercase border border-primary/20">{selectedCountry?.currency}</span>
                </div>
                <span className={`text-slate-400 dark:text-slate-300 transition-transform duration-200 ${countryDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              <AnimatePresence>
                {countryDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[998]" onClick={() => setCountryDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-64 rounded-2xl shadow-2xl z-[999] max-h-64 overflow-y-auto bg-white dark:bg-dark-955 border border-slate-200 dark:border-white/10"
                    >
                      <div className="p-1 flex flex-col gap-0.5">
                        {countries.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              handleCountrySwitch(c)
                              setCountryDropdownOpen(false)
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                              selectedCountry?.code === c.code
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 border border-transparent hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none">{getFlagEmoji(c.code)}</span>
                              <span>{c.name}</span>
                            </div>
                            <span className="text-2xs text-slate-400 font-mono uppercase">{c.currency}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          <h1 className="font-heading font-black text-3xl md:text-4xl text-white">
            Available Rental <span className="gradient-text">Rides</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse verified listings in {selectedCountry?.name} and rent directly from verified companies.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search make, model, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pr-10 focus:border-primary/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 glass-card p-6 h-fit sticky top-24 border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <h3 className="font-heading font-bold text-white text-base">Filters</h3>
            <button onClick={handleResetFilters} className="text-xs text-primary hover:text-cyan-400 transition-colors">
              Reset All
            </button>
          </div>
          <FilterPanel />
        </aside>

        {/* Mobile filter toggle */}
        <div className="lg:hidden flex items-center justify-between gap-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 glass px-4 py-2.5 rounded-xl border border-white/5 text-slate-300 text-sm font-semibold"
          >
            <span>🎛️</span> Filter Results
          </button>
          {[selectedBrand, selectedFuelType, selectedTransmission, selectedSeating, selectedCityId].some(Boolean) && (
            <button onClick={handleResetFilters} className="text-xs text-primary hover:underline">
              Reset Filters
            </button>
          )}
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileFilters(false)}
                className="fixed inset-0 bg-black z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-80 bg-dark-900 border-l border-white/5 z-50 p-6 flex flex-col gap-6 lg:hidden"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="font-heading font-bold text-white text-base">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
                  <FilterPanel />
                </div>
                <div className="flex gap-3 border-t border-white/5 pt-4">
                  <button onClick={() => { handleResetFilters(); setShowMobileFilters(false) }} className="btn-ghost flex-1 py-2 text-xs">Reset</button>
                  <button onClick={() => setShowMobileFilters(false)} className="btn-primary flex-1 py-2 text-xs">Apply Filters</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Car Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CarCardSkeleton key={i} />)}
            </div>
          ) : cars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cars.map((car) => <CarCard key={car.id} car={car} />)}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card text-center p-16 flex flex-col items-center justify-center border border-white/5"
            >
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">No Vehicles Found</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                We couldn&apos;t find any approved rental cars matching your current filters in {selectedCountry?.name}. Try relaxing your filters.
              </p>
              <button onClick={handleResetFilters} className="btn-primary mt-6 text-xs px-6 py-2.5">
                Clear Filters
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="container-app py-8 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading Marketplace...</p>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  )
}

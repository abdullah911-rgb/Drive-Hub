'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getFlagEmoji } from '@/lib/utils'
import { formatMoney } from '@/lib/currency'
import type { Country } from '@/types'

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
  country?: { name: string; currency?: string }
  company?: { name: string; countryId?: string; country?: { name: string; currency?: string } }
}

interface City { id: string; name: string }

const ROOM_TYPES = ['ALL', 'STANDARD', 'DELUXE', 'STUDIO', 'FAMILY']

export default function RoomsMarketplaceClient() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [maxPrice, setMaxPrice] = useState('')
  const [minCapacity, setMinCapacity] = useState('')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
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

  // Set initial country
  useEffect(() => {
    if (countries.length === 0) return
    const sessionCountry = typeof window !== 'undefined' ? sessionStorage.getItem('selectedCountry') : null
    const countryCode = sessionCountry || countries[0].code
    const match = countries.find(c => c.code.toUpperCase() === countryCode.toUpperCase())
    setSelectedCountry(match || countries[0])
  }, [countries])

  // Fetch cities when country changes
  useEffect(() => {
    if (!selectedCountry) return
    setSelectedCityId('')
    async function fetchCities() {
      try {
        const res = await fetch(`/api/cities?countryId=${selectedCountry!.id}&filterType=rooms`)
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

  const fetchRooms = useCallback(async () => {
    if (!selectedCountry) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: 'APPROVED' })
      params.set('countryId', selectedCountry.id)
      if (selectedType !== 'ALL') params.set('roomType', selectedType)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (minCapacity) params.set('minCapacity', minCapacity)
      if (selectedCityId) params.set('cityId', selectedCityId)
      const res = await fetch(`/api/rooms?${params}`)
      const data = await res.json()
      if (data.success) setRooms(data.data || [])
    } catch {
      console.error('Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }, [selectedCountry, selectedType, maxPrice, minCapacity, selectedCityId])

  useEffect(() => {
    const t = setTimeout(() => fetchRooms(), 200)
    return () => clearTimeout(t)
  }, [fetchRooms])

  const filtered = rooms.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.company?.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleCountrySwitch = (country: Country) => {
    setSelectedCountry(country)
    sessionStorage.setItem('selectedCountry', country.code)
    setCountryDropdownOpen(false)
  }

  const handleResetFilters = () => {
    setSearch('')
    setSelectedType('ALL')
    setMaxPrice('')
    setMinCapacity('')
    setSelectedCityId('')
  }

  const FilterPanel = () => (
    <div className="flex flex-col gap-5">
      {/* City */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Location / City</label>
        <select
          value={selectedCityId}
          onChange={e => setSelectedCityId(e.target.value)}
          className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white"
        >
          <option value="">All Cities</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Room Type */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Room Type</label>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white"
        >
          {ROOM_TYPES.map(t => (
            <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>
          ))}
        </select>
      </div>

      {/* Max Price */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Max Price / Night</label>
        <input
          type="number"
          className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white"
          placeholder={selectedCountry?.currency === 'PKR' ? 'e.g. 15000' : 'e.g. 200'}
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          min="0"
        />
        {selectedCountry?.currency && (
          <p className="text-[10px] text-slate-500 mt-1">Filter uses {selectedCountry.currency} (hotel local currency)</p>
        )}
      </div>

      {/* Min Guests */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Min Guests</label>
        <select
          value={minCapacity}
          onChange={e => setMinCapacity(e.target.value)}
          className="input w-full bg-dark-900/60 dark:bg-dark-900/60 text-slate-800 dark:text-white"
        >
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="4">4+</option>
          <option value="6">6+</option>
        </select>
      </div>
    </div>
  )

  return (
    <div className="container-app py-8">

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {/* Country Dropdown */}
            <div className="relative mb-3">
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
                            onClick={() => handleCountrySwitch(c)}
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

            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-3">
              🏨 Premium Hotel Rooms
            </div>
            <h1 className="font-heading font-black text-3xl md:text-4xl text-white mb-1">
              Find Your Perfect <span className="gradient-text">Stay</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Discover verified hotel rooms from trusted partners in {selectedCountry?.name}.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
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
          {[selectedType !== 'ALL', maxPrice, minCapacity, selectedCityId, search].some(Boolean) && (
            <button onClick={handleResetFilters} className="text-xs text-primary hover:underline">Reset Filters</button>
          )}
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                onClick={() => setShowMobileFilters(false)}
                className="fixed inset-0 bg-black z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
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

        {/* Room Grid */}
        <div className="lg:col-span-3">
          {!loading && (
            <p className="text-slate-500 text-xs mb-4">
              {filtered.length} room{filtered.length !== 1 ? 's' : ''} found
            </p>
          )}

          {loading ? (
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card no-card-hover h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card text-center p-16 flex flex-col items-center justify-center border border-white/5"
            >
              <div className="text-6xl mb-4">🏨</div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">No Rooms Found</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                We couldn&apos;t find any hotel rooms matching your filters in {selectedCountry?.name}. Try adjusting your criteria.
              </p>
              <button onClick={handleResetFilters} className="btn-primary mt-6 text-xs px-6 py-2.5">
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link href={`/marketplace/rooms/${room.id}`} className="block group">
                    <div className="glass-card h-full overflow-hidden">
                      {/* Image */}
                      <div className="relative w-full h-48 bg-white/5 overflow-hidden">
                        {room.images?.[0] ? (
                          <Image
                            src={room.images[0].imageUrl}
                            alt={room.name}
                            fill
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">🛏️</div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="text-xs bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg font-bold">
                            {room.roomType}
                          </span>
                        </div>
                        <div className="absolute top-3 left-3">
                          <span className="text-xs bg-primary/90 text-white px-2 py-1 rounded-lg font-bold">
                            {formatMoney(room.pricePerNight, room.country?.currency || room.company?.country?.currency || selectedCountry?.currency || 'PKR')}/night
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-white text-sm leading-tight">{room.name}</h3>
                        {room.company && (
                          <p className="text-xs text-primary mt-0.5">{room.company.name}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{room.description}</p>

                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                          <span>👥 {room.capacity} guests</span>
                          {room.floor && <span>🏢 {room.floor}</span>}
                          {room.amenities && room.amenities.length > 0 && (
                            <span>✨ {room.amenities.length} amenities</span>
                          )}
                        </div>

                        {room.amenities && room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {room.amenities.slice(0, 3).map(a => (
                              <span key={a} className="text-2xs bg-white/5 text-slate-400 px-1.5 py-0.5 rounded">{a}</span>
                            ))}
                            {room.amenities.length > 3 && (
                              <span className="text-2xs text-slate-500">+{room.amenities.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                          <div>
                            <span className="font-bold text-white text-base">{formatMoney(room.pricePerNight, room.country?.currency || room.company?.country?.currency || selectedCountry?.currency || 'PKR')}</span>
                            <span className="text-xs text-slate-400"> / night</span>
                          </div>
                          <span className="text-xs text-primary font-bold group-hover:underline">View Details →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

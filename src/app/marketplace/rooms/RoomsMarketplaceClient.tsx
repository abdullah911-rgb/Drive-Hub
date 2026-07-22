'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getFlagEmoji } from '@/lib/utils'
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
  company?: { name: string; countryId?: string; country?: { name: string } }
}

const ROOM_TYPES = ['ALL', 'STANDARD', 'DELUXE', 'STUDIO', 'FAMILY']

export default function RoomsMarketplaceClient() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [maxPrice, setMaxPrice] = useState('')
  const [minCapacity, setMinCapacity] = useState('')
  const [locationSearch, setLocationSearch] = useState('')

  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)

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

  useEffect(() => {
    if (countries.length === 0) return
    const sessionCountry = typeof window !== 'undefined' ? sessionStorage.getItem('selectedCountry') : null
    const countryCode = sessionCountry || countries[0].code
    const match = countries.find(c => c.code.toUpperCase() === countryCode.toUpperCase())
    if (match) {
      setSelectedCountry(match)
    } else {
      setSelectedCountry(countries[0])
    }
  }, [countries])

  useEffect(() => {
    if (!selectedCountry) return
    const loadRooms = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ status: 'APPROVED' })
        params.set('countryId', selectedCountry.id)
        if (selectedType !== 'ALL') params.set('roomType', selectedType)
        if (maxPrice) params.set('maxPrice', maxPrice)
        if (minCapacity) params.set('minCapacity', minCapacity)
        if (locationSearch) params.set('nearCity', locationSearch)
        const res = await fetch(`/api/rooms?${params}`)
        const data = await res.json()
        if (data.success) setRooms(data.data || [])
      } catch {
        console.error('Failed to load rooms')
      } finally {
        setLoading(false)
      }
    }
    loadRooms()
  }, [selectedCountry, selectedType, maxPrice, minCapacity, locationSearch])

  const filtered = rooms.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.company?.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleCountrySwitch = (country: Country) => {
    setSelectedCountry(country)
    sessionStorage.setItem('selectedCountry', country.code)
  }

  return (
    <div className="container-app py-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-2 rounded-full mb-4">
          🏨 Premium Hotel Rooms
        </div>
        <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-3">
          Find Your Perfect <span className="gradient-text">Stay</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
          Discover handpicked, verified hotel rooms from trusted partners. From cozy studios to spacious family rooms.
        </p>

        {/* Center Prominent Country Dropdown */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
              className="flex items-center justify-between gap-3 bg-dark-900 border border-white/10 hover:border-primary/40 rounded-xl px-4 py-2.5 text-xs text-white font-semibold transition-all shadow-lg min-w-[220px] text-left group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{getFlagEmoji(selectedCountry?.code || '')}</span>
                <span>{selectedCountry?.name || 'Loading Country...'}</span>
                <span className="text-3xs bg-white/5 text-slate-400 px-1 py-0.5 rounded font-mono uppercase">{selectedCountry?.currency}</span>
              </div>
              <span className={`text-slate-400 group-hover:text-white transition-transform duration-200 ${countryDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            <AnimatePresence>
              {countryDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setCountryDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-dark-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 max-h-60 overflow-y-auto"
                  >
                    <div className="p-1 flex flex-col gap-1">
                      {countries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            handleCountrySwitch(c)
                            setCountryDropdownOpen(false)
                          }}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-2xs font-semibold transition-all text-left ${
                            selectedCountry?.code === c.code
                              ? 'bg-primary/20 text-primary border border-primary/20'
                              : 'text-slate-300 hover:bg-white/5 border border-transparent hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{getFlagEmoji(c.code)}</span>
                            <span>{c.name}</span>
                          </div>
                          <span className="text-3xs text-slate-500 font-mono uppercase">{c.currency}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="glass-card no-card-hover p-4 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input
              className="input-field text-sm"
              placeholder="🔍 Search rooms, hotels..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <input
              className="input-field text-sm"
              placeholder="📍 Location / City..."
              value={locationSearch}
              onChange={e => setLocationSearch(e.target.value)}
            />
          </div>
          <div>
            <input
              type="number"
              className="input-field text-sm"
              placeholder="Max price per night (USD)"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
            />
          </div>
          <div>
            <input
              type="number"
              className="input-field text-sm"
              placeholder="Min guests"
              value={minCapacity}
              onChange={e => setMinCapacity(e.target.value)}
            />
          </div>
        </div>

        {/* Room Type Pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {ROOM_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                selectedType === type
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results Count */}
      {!loading && (
        <p className="text-slate-500 text-xs mb-5">
          {filtered.length} room{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card no-card-hover h-72 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏨</div>
          <h3 className="font-bold text-white text-lg mb-2">No rooms found</h3>
          <p className="text-slate-400 text-sm">Try adjusting your search filters</p>
        </div>
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
                        ${room.pricePerNight}/night
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
                        <span className="font-bold text-white text-base">${room.pricePerNight}</span>
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
  )
}

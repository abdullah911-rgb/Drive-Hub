'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'

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
  company?: {
    id: string
    name: string
    contactNumber?: string
    whatsAppNumber?: string
    email?: string
    businessAddress?: string
    country?: { name: string; code: string }
    city?: { name: string }
  }
}

const AMENITY_ICONS: Record<string, string> = {
  'WiFi': '📶',
  'AC': '❄️',
  'TV': '📺',
  'Minibar': '🍷',
  'Balcony': '🌅',
  'Ocean View': '🌊',
  'Jacuzzi': '🛁',
  'Kitchen': '🍳',
  'Gym Access': '💪',
  'Breakfast Included': '🍳',
}

export default function RoomDetailClient({ id }: { id: string }) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${id}`)
        const data = await res.json()
        if (data.success && data.data) {
          setRoom(data.data)
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [id])

  if (loading) {
    return (
      <div className="container-app py-16 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading room details...</p>
      </div>
    )
  }

  if (notFound || !room) {
    return (
      <div className="container-app py-20 text-center">
        <div className="text-5xl mb-4">🏨</div>
        <h1 className="font-bold text-white text-2xl mb-2">Room Not Found</h1>
        <p className="text-slate-400 text-sm mb-6">This room may no longer be available.</p>
        <Link href="/marketplace/rooms" className="btn-primary px-6 py-2">Browse All Rooms</Link>
      </div>
    )
  }

  const images = room.images || []
  const whatsappLink = room.company?.whatsAppNumber
    ? `https://wa.me/${room.company.whatsAppNumber.replace(/\D/g, '')}?text=Hi! I'm interested in booking the "${room.name}" room.`
    : null

  return (
    <div className="container-app py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/marketplace/rooms" className="hover:text-primary transition-colors">Hotels</Link>
        <span>/</span>
        <span className="text-slate-300">{room.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-white/5">
              {images.length > 0 ? (
                <Image
                  src={images[activeImage]?.imageUrl}
                  alt={room.name}
                  fill
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">🛏️</div>
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-primary/90 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {room.roomType}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === idx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Room Info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="glass-card no-card-hover p-6"
          >
            <h1 className="font-heading font-black text-2xl md:text-3xl text-white mb-1">{room.name}</h1>
            {room.company && (
              <p className="text-primary text-sm font-semibold mb-3">🏨 {room.company.name}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
              <span>👥 Up to {room.capacity} guests</span>
              {room.floor && <span>🏢 {room.floor}</span>}
              {room.company?.city && <span>📍 {room.company.city.name}</span>}
              {room.company?.country && <span>🌍 {room.company.country.name}</span>}
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">{room.description}</p>
          </motion.div>

          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="glass-card no-card-hover p-6"
            >
              <h2 className="font-bold text-white text-lg mb-4">Room Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {room.amenities.map(amenity => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5"
                  >
                    <span className="text-lg">{AMENITY_ICONS[amenity] || '✨'}</span>
                    <span className="text-sm text-slate-300">{amenity}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Booking Card */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="glass-card no-card-hover p-6 border border-primary/20 sticky top-24"
          >
            <div className="text-center mb-4">
              <div className="font-black text-3xl text-white">${room.pricePerNight}</div>
              <div className="text-xs text-slate-400">per night</div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Room Type</span>
                <span className="text-white font-medium">{room.roomType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Max Capacity</span>
                <span className="text-white font-medium">{room.capacity} guests</span>
              </div>
              {room.floor && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white font-medium">{room.floor}</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2.5">
              {whatsappLink ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-3 text-center text-sm font-bold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.555 4.104 1.527 5.831L0 24l6.335-1.521A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.802a9.794 9.794 0 01-4.994-1.366l-.358-.213-3.76.903.936-3.668-.234-.376A9.79 9.79 0 012.2 12C2.2 6.591 6.591 2.2 12 2.2c5.411 0 9.8 4.391 9.8 9.8 0 5.41-4.389 9.802-9.8 9.802z" />
                  </svg>
                  Book via WhatsApp
                </a>
              ) : room.company?.contactNumber ? (
                <a
                  href={`tel:${room.company.contactNumber}`}
                  className="btn-primary w-full py-3 text-center text-sm font-bold"
                >
                  📞 Call to Book
                </a>
              ) : null}

              {room.company?.email && (
                <a
                  href={`mailto:${room.company.email}?subject=Room Booking Inquiry: ${room.name}`}
                  className="w-full py-3 text-center text-sm font-bold glass border border-white/10 rounded-xl text-slate-300 hover:text-white hover:border-white/20 block transition-all"
                >
                  ✉️ Email Hotel
                </a>
              )}
            </div>

            {/* Hotel Info */}
            {room.company && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <h3 className="text-xs text-slate-400 font-bold uppercase mb-2">About the Hotel</h3>
                <div className="text-sm text-white font-bold mb-1">{room.company.name}</div>
                {room.company.businessAddress && (
                  <p className="text-xs text-slate-400">{room.company.businessAddress}</p>
                )}
                {room.company.country && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {room.company.city?.name ? `${room.company.city.name}, ` : ''}{room.company.country.name}
                  </p>
                )}
              </div>
            )}
          </motion.div>

          <Link
            href="/marketplace/rooms"
            className="block text-center text-xs text-slate-500 hover:text-primary transition-colors"
          >
            ← Browse all rooms
          </Link>
        </div>
      </div>
    </div>
  )
}

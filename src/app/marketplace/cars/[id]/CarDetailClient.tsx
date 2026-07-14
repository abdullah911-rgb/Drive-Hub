'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import SafeImage from '@/components/shared/SafeImage'
import { buildWhatsAppUrl, getStatusColor } from '@/lib/utils'
import type { Car, Company } from '@/types'

interface CarDetailClientProps {
  id: string
}

export default function CarDetailClient({ id }: CarDetailClientProps) {
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<string>('')

  useEffect(() => {
    async function fetchCarDetails() {
      try {
        const res = await fetch(`/api/cars/${id}`)
        if (res.ok) {
          const resData = await res.json()
          setCar(resData.data)
          const primaryImg = resData.data?.images?.find((i: { isPrimary?: boolean }) => i.isPrimary) || resData.data?.images?.[0]
          if (primaryImg) {
            setActiveImage(primaryImg.imageUrl)
          }
        }
      } catch (err) {
        console.error('Error fetching car details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCarDetails()
  }, [id])

  if (loading) {
    return (
      <div className="container-app py-16 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading Vehicle Details...</p>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="container-app py-16 text-center">
        <h2 className="font-heading font-bold text-white text-2xl mb-4">Vehicle Not Found</h2>
        <p className="text-slate-400 text-sm mb-8">The vehicle you are looking for does not exist or has been removed.</p>
        <Link href="/marketplace" className="btn-primary px-6 py-2.5 text-xs">
          Return to Marketplace
        </Link>
      </div>
    )
  }

  const company = car.company as Company | undefined
  const customWAMessage = `Hello, I saw your vehicle listing for the "${car.brand} ${car.model} (${car.year})" on NextTripy. I would like to inquire about its rental availability and rates.`
  const waUrl = company ? buildWhatsAppUrl(company.whatsAppNumber, customWAMessage) : '#'

  return (
    <div className="container-app py-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold mb-6 transition-colors"
      >
        <span>←</span> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-dark-800 border border-white/5 shadow-2xl">
            {activeImage ? (
              <SafeImage
                src={activeImage}
                alt={`${car.brand} ${car.model} ${car.year} rental car`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">🚗</div>
            )}
            <div className="absolute top-4 left-4 z-10">
              <span className={`badge border text-xs px-2.5 py-1 ${getStatusColor(car.status)}`}>
                {car.status}
              </span>
            </div>
          </div>

          {car.images && car.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {car.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`relative w-24 h-16 rounded-xl overflow-hidden border flex-shrink-0 bg-dark-700 transition-all ${
                    activeImage === img.imageUrl
                      ? 'border-primary shadow-neon-violet'
                      : 'border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={img.imageUrl}
                    alt={`${car.brand} ${car.model} thumbnail`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-6 border border-white/5">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">
                {car.transmission} • {car.fuelType}
              </span>
              <span className="text-slate-500 text-xs">Reg #: {car.regNumber}</span>
            </div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-white mb-2">
              {car.brand} {car.model}
            </h1>
            <p className="text-slate-400 text-sm">
              Year {car.year} • Color: {car.color} • {car.country?.name}
            </p>

            <div className="border-t border-white/5 my-6" />

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 text-xs block mb-0.5">Mileage</span>
                <span className="text-white text-sm font-semibold">{car.mileage.toLocaleString()} km</span>
              </div>
              <div className="glass p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 text-xs block mb-0.5">Seating</span>
                <span className="text-white text-sm font-semibold">{car.seatingCapacity} Passengers</span>
              </div>
              <div className="glass p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 text-xs block mb-0.5">Fuel Type</span>
                <span className="text-white text-sm font-semibold">{car.fuelType}</span>
              </div>
              <div className="glass p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 text-xs block mb-0.5">Transmission</span>
                <span className="text-white text-sm font-semibold">{car.transmission}</span>
              </div>
            </div>
          </div>

          {company && (
            <div className="glass-card p-6 border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-4">
                <div>
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Offered by</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-neon-violet">
                      {company.name[0].toUpperCase()}
                    </div>
                    <div>
                      <Link
                        href={`/marketplace/companies/${company.id}`}
                        className="font-heading font-bold text-white text-sm hover:text-primary transition-colors block"
                      >
                        {company.name}
                      </Link>
                      <span className="text-xs text-slate-400">{company.businessAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 my-1" />

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Connect on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="glass-card p-6 border border-white/5">
            <h3 className="font-heading font-bold text-white text-lg mb-4">Description</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {car.description}
            </p>
          </div>

          {car.features && car.features.length > 0 && (
            <div className="glass-card p-6 border border-white/5">
              <h3 className="font-heading font-bold text-white text-lg mb-4">Features & Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {car.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-slate-300 text-sm">
                    <span className="text-primary text-base">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-6 border border-white/5">
            <h3 className="font-heading font-bold text-white text-lg mb-4">Verification Specs</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-white/5">
                <span className="text-slate-500">Engine Number</span>
                <span className="text-slate-300 font-mono text-xs">{car.engineNumber || 'Verified'}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-white/5">
                <span className="text-slate-500">Registration Number</span>
                <span className="text-slate-300 font-mono text-xs">{car.regNumber || 'Verified'}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-white/5">
                <span className="text-slate-500">Color</span>
                <span className="text-slate-300">{car.color}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5">
                <span className="text-slate-500">Year of Manufacture</span>
                <span className="text-slate-300">{car.year}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

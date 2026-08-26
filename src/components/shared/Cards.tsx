'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import SafeImage from '@/components/shared/SafeImage'
import { buildWhatsAppUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/utils'
import { formatMoney } from '@/lib/currency'
import { RatingStars, StatusBadge } from '@/components/ui'
import type { Car, Company, Room } from '@/types'

// Shared hook to check auth state once on mount
function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null) // null = loading

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) {
          setIsLoggedIn(false)
          return
        }
        const data = await r.json()
        setIsLoggedIn(Boolean(data?.data))
      })
      .catch(() => setIsLoggedIn(false))
  }, [])

  return isLoggedIn
}

// Shared WhatsApp button that shows login prompt when not authenticated
function WhatsAppButton({
  href,
  isLoggedIn,
  className,
  children,
}: {
  href: string
  isLoggedIn: boolean | null
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()

  if (isLoggedIn === false) {
    return (
      <button
        onClick={() => {
          toast.info('Sign in to contact this provider on WhatsApp', {
            action: { label: 'Sign In', onClick: () => router.push('/auth') },
          })
        }}
        className={className}
      >
        {children}
      </button>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}

interface CarCardProps { car: Car; showStatus?: boolean; priority?: boolean }

export function CarCard({ car, showStatus = false, priority = false }: CarCardProps) {
  const primaryImage = car.images?.find(i => i.isPrimary) || car.images?.[0]
  const company = car.company as Company | undefined
  const waUrl = company ? buildWhatsAppUrl(company.whatsAppNumber, WHATSAPP_DEFAULT_MESSAGE) : '#'
  const isLoggedIn = useIsLoggedIn()

  return (
    <div className="glass-card glass-card-interactive overflow-hidden flex flex-col group animate-fade-in">
      <div className="relative h-36 overflow-hidden bg-slate-100 dark:bg-dark-700">
        {primaryImage ? (
          <SafeImage
            src={primaryImage.imageUrl}
            alt={`${car.brand} ${car.model} ${car.year} rental`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🚗</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="bg-secondary-500/10 text-secondary-500 backdrop-blur-md px-2 py-0.5 rounded-md text-2xs font-bold uppercase tracking-wider border border-secondary-500/20">
            {car.transmission}
          </span>
        </div>
        {showStatus && (
          <div className="absolute top-3 right-3">
            <StatusBadge status={car.status} />
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-heading font-bold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-primary transition-colors">
            {car.brand} {car.model}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-2xs mt-0.5 font-medium">{car.year} • {car.color}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-2xs text-slate-500 dark:text-slate-400">{car.fuelType}</span>
          <span className="text-2xs text-slate-400 dark:text-slate-600">·</span>
          <span className="text-2xs text-slate-500 dark:text-slate-400">{car.seatingCapacity} seats</span>
          <span className="text-2xs text-slate-400 dark:text-slate-600">·</span>
          <span className="text-2xs text-slate-500 dark:text-slate-400">{car.mileage.toLocaleString()} km</span>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-2xs leading-relaxed line-clamp-2">{car.description}</p>

        <div className="flex gap-2 mt-auto pt-2 border-t border-border/10">
          <Link href={`/marketplace/cars/${car.id}`} className="btn-primary text-2xs flex-1 py-1.5 font-bold rounded-lg shadow-sm">
            View Details
          </Link>
          {company && (
            <WhatsAppButton
              href={waUrl}
              isLoggedIn={isLoggedIn}
              className="btn-whatsapp text-2xs flex-1 py-1.5 font-bold rounded-lg shadow-sm flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </WhatsAppButton>
          )}
        </div>
      </div>
    </div>
  )
}

interface CompanyCardProps { company: Company }

export function CompanyCard({ company }: CompanyCardProps) {
  const waUrl = buildWhatsAppUrl(company.whatsAppNumber, WHATSAPP_DEFAULT_MESSAGE)
  const isLoggedIn = useIsLoggedIn()

  return (
    <div className="glass-card glass-card-interactive p-4 flex flex-col gap-3 group animate-fade-in">
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
          {company.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-primary transition-colors truncate">
            {company.name}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-2xs mt-0.5 truncate font-medium">
            {(company.country as { name?: string })?.name || ''}
          </p>
        </div>
        <StatusBadge status={company.status} />
      </div>

      {company.averageRating !== undefined && (
        <RatingStars rating={company.averageRating} count={company.totalReviews} size="sm" />
      )}

      <div className="flex items-center gap-2 text-2xs text-slate-600 dark:text-slate-400">
        <span className="text-slate-700 dark:text-slate-300">
          {company.companyType === 'HOTEL'
            ? `${company.totalRooms || 0} rooms`
            : `${company.totalCars || 0} cars`}
        </span>
        {(() => {
          const loc = (company.city as { name?: string })?.name
            || (company.country as { name?: string })?.name
          return loc
            ? <><span className="text-slate-400 dark:text-slate-600">·</span><span className="truncate">{loc}</span></>
            : null
        })()}
      </div>

      <div className="flex gap-2 mt-auto pt-2 border-t border-border/10">
        <Link href={`/marketplace/companies/${company.id}`} className="btn-primary text-2xs flex-1 py-1.5 font-bold rounded-lg shadow-sm text-center">
          View Profile
        </Link>
        <WhatsAppButton
          href={waUrl}
          isLoggedIn={isLoggedIn}
          className="btn-whatsapp text-2xs flex-1 py-1.5 font-bold rounded-lg shadow-sm text-center flex items-center justify-center"
        >
          WhatsApp
        </WhatsAppButton>
      </div>
    </div>
  )
}

interface RoomCardProps { room: Room; showStatus?: boolean }

export function RoomCard({ room, showStatus = false }: RoomCardProps) {
  const primaryImage = room.images?.find(i => i.isPrimary) || room.images?.[0]
  const company = room.company as Company | undefined
  const waUrl = company ? buildWhatsAppUrl(company.whatsAppNumber, WHATSAPP_DEFAULT_MESSAGE) : '#'
  const isLoggedIn = useIsLoggedIn()

  return (
    <div className="glass-card glass-card-interactive overflow-hidden flex flex-col group animate-fade-in">
      <div className="relative h-36 overflow-hidden bg-slate-100 dark:bg-dark-700">
        {primaryImage ? (
          <SafeImage
            src={primaryImage.imageUrl}
            alt={`${room.name} room`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🛏️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="bg-primary/90 text-white backdrop-blur-md px-2 py-0.5 rounded-md text-2xs font-bold uppercase tracking-wider border border-primary/20">
            {formatMoney(room.pricePerNight, room.country?.currency || room.company?.country?.currency || 'PKR')}/night
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-2xs">
            {room.roomType}
          </span>
        </div>
        {showStatus && (
          <div className="absolute top-8 right-2">
            <StatusBadge status={room.status} />
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-heading font-bold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-primary transition-colors truncate">
            {room.name}
          </h3>
          {company && (
            <p className="text-primary text-2xs mt-0.5 font-medium truncate">{company.name}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 text-2xs text-slate-600 dark:text-slate-400">
          <span>{room.capacity} guests</span>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-2xs leading-relaxed line-clamp-2">{room.description}</p>

        <div className="flex gap-2 mt-auto pt-2 border-t border-border/10">
          <Link href={`/marketplace/rooms/${room.id}`} className="btn-primary text-2xs flex-1 py-1.5 font-bold rounded-lg shadow-sm text-center">
            View Details
          </Link>
          {company && (
            <WhatsAppButton
              href={waUrl}
              isLoggedIn={isLoggedIn}
              className="btn-whatsapp text-2xs flex-1 py-1.5 font-bold rounded-lg shadow-sm text-center flex items-center justify-center"
            >
              WhatsApp
            </WhatsAppButton>
          )}
        </div>
      </div>
    </div>
  )
}

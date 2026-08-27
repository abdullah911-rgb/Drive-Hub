import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatPhoneForWhatsApp(phone: string): string {
  let clean = phone.replace(/\D/g, '')

  if (clean.startsWith('00')) {
    clean = clean.slice(2)
  }

  if (clean.startsWith('0')) {
    clean = clean.slice(1)
  }

  const commonCountryCodes = ['92', '966', '971', '91', '880', '1', '44']
  if (commonCountryCodes.some(cc => clean.startsWith(cc) && clean.length > cc.length + 7)) {
    return clean
  }

  if (clean.length === 10 && clean.startsWith('3')) {
    return '92' + clean
  }

  if (clean.length === 9 && clean.startsWith('5')) {
    return '966' + clean
  }

  if (clean.length === 10) {
    return '92' + clean
  }

  return clean
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hello, I found your vehicle listing on NextTripy Marketplace and would like to know about its availability and rental details."

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    APPROVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    REJECTED: 'text-red-400 bg-red-400/10 border-red-400/30',
    SUSPENDED: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    BANNED: 'text-red-600 bg-red-600/10 border-red-600/30',
    ACTIVE: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    EXPIRED: 'text-red-400 bg-red-400/10 border-red-400/30',
    CANCELLED: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  }
  return map[status] || 'text-slate-400 bg-slate-400/10 border-slate-400/30'
}

export function getRatingStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}

export const PAKISTAN_PAYMENT_GATEWAYS = [
  { id: 'jazzcash', name: 'JazzCash', icon: '💚', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/25/JazzCash_Logo.png' },
  { id: 'easypaisa', name: 'Easypaisa', icon: '💜', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Easypaisa_logo.png' },
  { id: 'card', name: 'Credit / Debit Card', icon: '💳', logoUrl: '/credit-card.jfif' },
]

export const SAUDI_PAYMENT_GATEWAYS = [
  { id: 'mada', name: 'Mada', icon: '💳', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Mada_Logo.svg' },
  { id: 'apple_pay', name: 'Apple Pay', icon: '', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
  { id: 'card', name: 'Credit / Debit Card', icon: '💳', logoUrl: '/credit-card.jfif' },
]

export const GENERAL_PAYMENT_GATEWAYS = [
  { id: 'stripe', name: 'Credit / Debit Card', icon: '💳', logoUrl: '/credit-card.jfif' },
  { id: 'paypal', name: 'PayPal', icon: '📱', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' },
  { id: 'bank_transfer_intl', name: 'International Wire', icon: '🌐', logoUrl: '/international-card.jfif' },
]

export function getPaymentGateways(country: string) {
  if (country === 'SA') return SAUDI_PAYMENT_GATEWAYS
  if (country === 'PK') return PAKISTAN_PAYMENT_GATEWAYS
  return GENERAL_PAYMENT_GATEWAYS
}

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return '🌍'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  try {
    return String.fromCodePoint(...codePoints)
  } catch {
    return '🌍'
  }
}

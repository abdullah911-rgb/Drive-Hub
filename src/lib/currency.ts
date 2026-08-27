
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  PKR: 278.50,
  SAR: 3.75,
  AED: 3.67,
  GBP: 0.79,
  EUR: 0.92,
  INR: 83.50,
  CAD: 1.37,
  AUD: 1.51,
}

export async function getExchangeRate(targetCurrency: string): Promise<number> {
  const currency = targetCurrency.toUpperCase().trim()
  if (currency === 'USD') return 1.0

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 } 
    })
    if (res.ok) {
      const data = await res.json()
      if (data.rates && typeof data.rates[currency] === 'number') {
        return data.rates[currency]
      }
    }
  } catch (error) {
    console.warn(`[Currency] Failed to fetch exchange rate for ${currency}, using fallback.`, error)
  }

  return FALLBACK_RATES[currency] || 1.0
}

export async function convertUSD(amountUSD: number, targetCurrency: string): Promise<{ amount: number; rate: number }> {
  const rate = await getExchangeRate(targetCurrency)
  const amount = Math.round(amountUSD * rate * 100) / 100
  return { amount, rate }
}

export async function convertPKR(amountPKR: number, targetCurrency: string): Promise<{ amount: number; rate: number }> {
  const currency = targetCurrency.toUpperCase().trim()
  if (currency === 'PKR') {
    return { amount: amountPKR, rate: 1 }
  }

  const pkrPerUsd = await getExchangeRate('PKR')
  const amountUSD = amountPKR / pkrPerUsd
  const targetRate = currency === 'USD' ? 1 : await getExchangeRate(currency)
  const amount = Math.round(amountUSD * targetRate * 100) / 100
  const rate = targetRate / pkrPerUsd

  return { amount, rate }
}

export function formatSubscriptionPrice(amount: number, currency: string): string {
  const code = currency.toUpperCase()
  if (code === 'PKR') return `Rs. ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  if (code === 'USD') return `$${amount.toFixed(2)}`
  if (code === 'EUR' || code === 'GBP') {
    const symbol = code === 'EUR' ? '€' : '£'
    return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${code}`
}

export function toMoneyNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  if (value && typeof value === 'object') {
    const o = value as { toNumber?: () => number; toString?: () => string }
    if (typeof o.toNumber === 'function') {
      const n = o.toNumber()
      if (Number.isFinite(n)) return n
    }
    const n = Number(typeof o.toString === 'function' ? o.toString() : value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

export function formatMoney(amount: unknown, currency = 'PKR'): string {
  return formatSubscriptionPrice(toMoneyNumber(amount), currency || 'PKR')
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENCY CONVERSION UTILITY
// Dynamic currency rates with offline fallback rates
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * Fetches the latest exchange rate for a given currency code against USD.
 * Falls back to hardcoded rates if the API is unreachable.
 */
export async function getExchangeRate(targetCurrency: string): Promise<number> {
  const currency = targetCurrency.toUpperCase().trim()
  if (currency === 'USD') return 1.0

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 } // Cache for 1 hour in Next.js fetch
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

/**
 * Converts a USD amount to target currency.
 * Returns both the converted amount and the rate used.
 */
export async function convertUSD(amountUSD: number, targetCurrency: string): Promise<{ amount: number; rate: number }> {
  const rate = await getExchangeRate(targetCurrency)
  const amount = Math.round(amountUSD * rate * 100) / 100 // Round to 2 decimal places
  return { amount, rate }
}

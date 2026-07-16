import { NextResponse } from 'next/server'
import { getCachedCountries } from '@/lib/data'
import { COUNTRIES } from '@/lib/countries'

export async function GET() {
  try {
    const countries = await getCachedCountries()
    if (!countries || countries.length === 0) {
      return NextResponse.json({ success: true, data: COUNTRIES })
    }
    return NextResponse.json({ success: true, data: countries })
  } catch (error) {
    console.warn('Database countries fetch failed, falling back to static list')
    return NextResponse.json({ success: true, data: COUNTRIES })
  }
}

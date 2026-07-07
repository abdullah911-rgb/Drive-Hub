import { NextResponse } from 'next/server'
import { getCachedCountries } from '@/lib/data'

export async function GET() {
  try {
    const countries = await getCachedCountries()
    return NextResponse.json({ success: true, data: countries })
  } catch (error) {
    console.error('Countries GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch countries' }, { status: 500 })
  }
}

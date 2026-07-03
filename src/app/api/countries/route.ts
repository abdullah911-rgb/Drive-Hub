import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const countries = await db.getCountries()
    return NextResponse.json({ success: true, data: countries })
  } catch (error) {
    console.error('Countries GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch countries' }, { status: 500 })
  }
}

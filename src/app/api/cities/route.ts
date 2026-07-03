import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId') || undefined
    const cities = await db.getCities(countryId)
    return NextResponse.json({ success: true, data: cities })
  } catch (error) {
    console.error('Cities GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch cities' }, { status: 500 })
  }
}

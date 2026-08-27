import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePrisma } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, flagUrl: true, currency: true, dialCode: true },
    })
    return NextResponse.json({ success: true, data: serializePrisma(countries) })
  } catch (error) {
    console.error('Countries GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch countries' }, { status: 500 })
  }
}

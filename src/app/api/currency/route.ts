import { NextRequest, NextResponse } from 'next/server'
import { convertUSD } from '@/lib/currency'

/**
 * GET /api/currency?from=USD&to=PKR&amount=99
 * Converts an amount from one currency to another (defaults to USD→target).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to') || 'USD'
    const amount = parseFloat(searchParams.get('amount') || '99')

    if (isNaN(amount)) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    const { amount: converted, rate } = await convertUSD(amount, to)

    return NextResponse.json({
      success: true,
      data: {
        from: 'USD',
        to: to.toUpperCase(),
        amountUSD: amount,
        converted: Math.round(converted * 100) / 100,
        rate,
      },
    })
  } catch (error) {
    console.error('[Currency API] Error:', error)
    return NextResponse.json({ success: false, error: 'Currency conversion failed' }, { status: 500 })
  }
}

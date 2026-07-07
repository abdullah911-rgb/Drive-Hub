import { NextRequest, NextResponse } from 'next/server'
import { convertPKR } from '@/lib/currency'
import { SUBSCRIPTION_BASE_PKR } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to') || 'PKR'
    const amount = parseFloat(searchParams.get('amount') || String(SUBSCRIPTION_BASE_PKR))

    if (isNaN(amount)) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    const { amount: converted, rate } = await convertPKR(amount, to)

    return NextResponse.json({
      success: true,
      data: {
        from: 'PKR',
        to: to.toUpperCase(),
        amountPKR: amount,
        converted: Math.round(converted * 100) / 100,
        rate,
      },
    })
  } catch (error) {
    console.error('[Currency API] Error:', error)
    return NextResponse.json({ success: false, error: 'Currency conversion failed' }, { status: 500 })
  }
}

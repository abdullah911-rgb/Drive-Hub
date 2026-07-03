import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ success: false, error: 'companyId required' }, { status: 400 })
  const reviews = await db.getReviewsByCompanyId(companyId)
  return NextResponse.json({ success: true, data: reviews })
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Only customers can post reviews' }, { status: 401 })
    }
    if (currentUser.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Account not approved' }, { status: 403 })
    }
    const { companyId, rating, comment } = await request.json()
    if (!companyId || !rating || !comment) {
      return NextResponse.json({ success: false, error: 'companyId, rating and comment required' }, { status: 400 })
    }
    const review = await db.createReview({
      id: uuidv4(), companyId, userId: currentUser.userId,
      rating: Math.min(5, Math.max(1, parseInt(rating))),
      comment, isVisible: true,
    })
    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to post review' }, { status: 500 })
  }
}

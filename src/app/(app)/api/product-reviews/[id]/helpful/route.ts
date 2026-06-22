import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const reviewId = Number(id)
  if (!Number.isFinite(reviewId)) {
    return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  // Require authentication so the counter can't be stuffed anonymously.
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const review = await payload.findByID({
    id: reviewId,
    collection: 'product-reviews',
    depth: 0,
    overrideAccess: true,
  })

  if (!review || review.moderationStatus !== 'approved') {
    return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
  }

  const helpfulCount = typeof review.helpfulCount === 'number' ? review.helpfulCount : 0

  const updated = await payload.update({
    id: reviewId,
    collection: 'product-reviews',
    data: {
      helpfulCount: helpfulCount + 1,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ helpfulCount: updated.helpfulCount ?? helpfulCount + 1 })
}

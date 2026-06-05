import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_ITEMS = 12

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ productIds: [] })
  }

  const result = await payload.find({
    collection: 'recently-viewed',
    depth: 1,
    limit: MAX_ITEMS,
    overrideAccess: true,
    sort: '-viewedAt',
    where: { user: { equals: user.id } },
  })

  const productIds = result.docs
    .map((row) => {
      const product = row.product
      return typeof product === 'object' && product ? product.id : product
    })
    .filter((id): id is number => typeof id === 'number')

  return NextResponse.json({ productIds, docs: result.docs })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ ok: true })
  }

  const body = (await request.json().catch(() => ({}))) as { productId?: unknown }
  const productId = Number(body.productId)
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: 'productId is required.' }, { status: 400 })
  }

  const existing = await payload.find({
    collection: 'recently-viewed',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { user: { equals: user.id } },
        { product: { equals: productId } },
      ],
    },
  })

  const viewedAt = new Date().toISOString()

  if (existing.docs[0]) {
    await payload.update({
      id: existing.docs[0].id,
      collection: 'recently-viewed',
      data: { viewedAt },
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'recently-viewed',
      data: {
        product: productId,
        user: user.id,
        viewedAt,
      },
      overrideAccess: true,
    })
  }

  return NextResponse.json({ ok: true })
}

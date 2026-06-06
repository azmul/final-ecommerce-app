import { getProductAffinityIds } from '@/lib/ai/productAffinity'
import configPromise from '@payload-config'
import type { Product } from '@/payload-types'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idRaw } = await params
  const productId = Number(idRaw)

  if (!Number.isFinite(productId) || productId < 1) {
    return NextResponse.json({ products: [] })
  }

  const payload = await getPayload({ config: configPromise })
  const relatedIds = await getProductAffinityIds(payload, productId, 6)

  if (!relatedIds.length) {
    return NextResponse.json({ products: [] })
  }

  const result = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: relatedIds.length,
    overrideAccess: false,
    where: {
      and: [{ id: { in: relatedIds } }, { _status: { equals: 'published' } }],
    },
  })

  const order = new Map(relatedIds.map((id, index) => [id, index]))
  const products = [...(result.docs as Product[])].sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
  )

  return NextResponse.json({ products })
}

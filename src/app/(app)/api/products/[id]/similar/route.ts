import { fetchSimilarProductIds } from '@/lib/ai/similarProducts'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const productId = Number(id)
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const ids = await fetchSimilarProductIds({
    excludeProductId: productId,
    limit: 8,
    payload,
  })

  if (!ids.length) {
    return NextResponse.json({ products: [] })
  }

  const { docs } = await payload.find({
    collection: 'products',
    depth: 2,
    limit: ids.length,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { id: { in: ids } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  const byId = new Map(docs.map((doc) => [doc.id, doc]))
  const ordered = ids.flatMap((pid) => {
    const doc = byId.get(pid)
    return doc ? [doc] : []
  })

  return NextResponse.json({ products: ordered })
}

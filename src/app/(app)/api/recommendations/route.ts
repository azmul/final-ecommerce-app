import { fetchRecommendationsForAi } from '@/lib/ai/recommendations'
import configPromise from '@payload-config'
import type { Product } from '@/payload-types'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const contextRaw = url.searchParams.get('context')
  const context =
    contextRaw === 'homepage' || contextRaw === 'pdp' || contextRaw === 'cart' ? contextRaw : 'homepage'
  const productId = Number(url.searchParams.get('productId'))
  const cartId = Number(url.searchParams.get('cartId'))
  const limit = Number(url.searchParams.get('limit'))

  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })
  const userId = auth.user && typeof auth.user.id === 'number' ? auth.user.id : undefined

  const result = await fetchRecommendationsForAi(payload, {
    cartId: Number.isFinite(cartId) && cartId > 0 ? cartId : undefined,
    context,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 8,
    productId: Number.isFinite(productId) && productId > 0 ? productId : undefined,
    userId,
  })

  const ids = result.products.map((product) => product.id)
  if (!ids.length) {
    return NextResponse.json({ products: [] })
  }

  const docs = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: ids.length,
    overrideAccess: false,
    where: {
      and: [{ id: { in: ids } }, { _status: { equals: 'published' } }],
    },
  })

  const order = new Map(ids.map((id, index) => [id, index]))
  const products = [...(docs.docs as Product[])].sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
  )

  return NextResponse.json({ products })
}

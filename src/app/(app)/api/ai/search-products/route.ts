import { searchProductsForAi } from '@/lib/ai/searchProducts'
import { withAiPostHandler } from '@/lib/ai/rateLimit'
import type { ProductSearchFilters } from '@/lib/ai/types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// TODO: desired rate-limit budget is { limit: 60, windowMs: 60_000 } (cheapest endpoint, just queries).
// `withAiPostHandler` currently applies its built-in defaults (30 / 60_000); pass options once supported.
const _postHandler = async (request: Request, _ctx: any): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })

  let body: ProductSearchFilters = {}
  try {
    body = (await request.json()) as ProductSearchFilters
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  try {
    const result = await searchProductsForAi(payload, body)
    return NextResponse.json(result)
  } catch (error) {
    payload.logger.error({ err: error, msg: 'ai-search-products' })
    return NextResponse.json({ error: 'Product search failed.' }, { status: 500 })
  }
}

export const POST = withAiPostHandler(_postHandler)

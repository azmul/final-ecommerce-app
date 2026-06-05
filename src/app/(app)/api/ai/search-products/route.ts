import { searchProductsForAi } from '@/lib/ai/searchProducts'
import type { ProductSearchFilters } from '@/lib/ai/types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

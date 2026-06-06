import { hybridProductSearchFormatted } from '@/lib/search/hybridProductSearch'
import configPromise from '@payload-config'
import { toAbsoluteUrl } from '@/utilities/getURL'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LIMIT = 5

function normalizeQuery(raw: string | null): string {
  const t = typeof raw === 'string' ? raw.trim() : ''
  return t
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = normalizeQuery(url.searchParams.get('q'))

  if (!q.length) {
    return NextResponse.json({ docs: [] as unknown[] })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const hybrid = await hybridProductSearchFormatted({
      limit: LIMIT,
      payload,
      query: q,
    })

    const docs = hybrid.products.slice(0, LIMIT).map((product) => ({
      aiMatched: hybrid.aiMatched,
      brandName: product.brand,
      hasDiscount: (product.discountPercentage ?? 0) > 0,
      id: product.id,
      listPrice: product.price,
      salePrice: product.salePrice ?? product.price,
      slug: product.slug,
      thumbnailUrl: product.imageUrl ? toAbsoluteUrl(product.imageUrl) : null,
      title: product.title,
    }))

    return NextResponse.json({ aiMatched: hybrid.aiMatched, docs })
  } catch (error) {
    console.error('[product-search]', error)
    return NextResponse.json({ error: 'Search failed', docs: [] }, { status: 500 })
  }
}

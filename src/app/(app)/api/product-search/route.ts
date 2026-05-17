import { buildPublishedProductWhere } from '@/lib/search/productSearch'
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

function computePrices(product: {
  priceInBDT?: number | null
  discountPercentage?: number | null
  enableVariants?: boolean | null
  variants?: { docs?: unknown[] | null }
}): { listPrice: number | null; salePrice: number | null; hasDiscount: boolean } {
  let listPrice =
    typeof product.priceInBDT === 'number' && Number.isFinite(product.priceInBDT) ?
      product.priceInBDT
    : null

  const docs = product.variants?.docs
  if (
    product.enableVariants &&
    Array.isArray(docs) &&
    docs.length > 0 &&
    docs[0] &&
    typeof docs[0] === 'object'
  ) {
    const pv = docs[0] as { priceInBDT?: number | null }
    if (typeof pv.priceInBDT === 'number' && Number.isFinite(pv.priceInBDT)) {
      listPrice = pv.priceInBDT
    }
  }

  if (listPrice === null) {
    return { listPrice: null, salePrice: null, hasDiscount: false }
  }

  const rawPct =
    typeof product.discountPercentage === 'number' && Number.isFinite(product.discountPercentage) ?
      product.discountPercentage
    : 0
  const discountPercent = Math.min(Math.max(Math.round(rawPct), 0), 100)
  const hasDiscount = discountPercent > 0
  const salePrice =
    hasDiscount ? Math.round(listPrice * (100 - discountPercent)) / 100 : listPrice

  return {
    listPrice,
    salePrice,
    hasDiscount,
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = normalizeQuery(url.searchParams.get('q'))

  if (!q.length) {
    return NextResponse.json({ docs: [] as unknown[] })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const results = await payload.find({
      collection: 'products',
      depth: 2,
      draft: false,
      limit: LIMIT,
      overrideAccess: false,
      pagination: false,
      sort: 'title',
      where: buildPublishedProductWhere({ searchValue: q }),
    })

    type BrandDoc = { title?: string }
    type GalleryEntry = { image?: number | { url?: string | null } }
    type ProductHit = Record<string, unknown>

    const docs = results.docs.map((doc) => {
      const hit = doc as unknown as ProductHit
      const slug = typeof hit.slug === 'string' ? hit.slug : ''
      const title = typeof hit.title === 'string' ? hit.title : ''
      const gallery = hit.gallery as GalleryEntry[] | undefined
      const firstImage = gallery?.[0]?.image
      let thumbnailUrl: string | null = null
      if (firstImage && typeof firstImage === 'object') {
        const u = typeof firstImage.url === 'string' ? firstImage.url : null
        thumbnailUrl = u ? (toAbsoluteUrl(u) ?? null) : null
      }

      const brandVal = hit.brand
      const brandName =
        brandVal &&
        typeof brandVal === 'object' &&
        'title' in brandVal &&
        typeof (brandVal as BrandDoc).title === 'string' ?
          (brandVal as BrandDoc).title
        : null

      const { listPrice, salePrice, hasDiscount } = computePrices(
        hit as Parameters<typeof computePrices>[0],
      )

      return {
        id: hit.id,
        title,
        slug,
        thumbnailUrl,
        brandName,
        listPrice,
        salePrice,
        hasDiscount,
      }
    })

    return NextResponse.json({ docs })
  } catch (error) {
    console.error('[product-search]', error)
    return NextResponse.json({ error: 'Search failed', docs: [] }, { status: 500 })
  }
}

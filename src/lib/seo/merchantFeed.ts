import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

export type MerchantFeedItem = {
  id: string
  title: string
  description: string
  link: string
  image_link?: string
  availability: 'in stock' | 'out of stock'
  price: string
  brand?: string
  condition: 'new'
  google_product_category?: string
  gtin?: string
  mpn?: string
  identifier_exists?: 'no'
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function buildGoogleMerchantFeedItems(): Promise<MerchantFeedItem[]> {
  const base = getServerSideURL()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: 5000,
    overrideAccess: false,
    pagination: false,
    where: { _status: { equals: 'published' } },
  })

  return result.docs
    .filter((product) => typeof product.slug === 'string' && product.slug)
    .map((product) => {
      const slug = product.slug as string
      const link = `${base}/products/${slug}`

      let price: number | undefined =
        typeof product.priceInBDT === 'number' ? product.priceInBDT : undefined
      if (product.enableVariants && product.variants?.docs?.length) {
        price = product.variants.docs.reduce<number | undefined>((acc, variant) => {
          const variantPrice =
            variant && typeof variant === 'object' ? variant.priceInBDT : undefined
          if (typeof variantPrice === 'number' && (typeof acc !== 'number' || variantPrice > acc)) {
            return variantPrice
          }
          return acc
        }, price)
      }

      const hasStock = product.enableVariants
        ? Boolean(
            product.variants?.docs?.some((variant) => {
              if (!variant || typeof variant !== 'object') return false
              return (variant.inventory ?? 0) > 0
            }),
          )
        : (product.inventory ?? 0) > 0

      const galleryImage = product.gallery?.find((row) => row?.image && typeof row.image === 'object')
        ?.image
      const metaImage =
        product.meta?.image && typeof product.meta.image === 'object' ? product.meta.image : null
      const imageUrl =
        (metaImage?.url && toAbsoluteUrl(metaImage.url)) ||
        (galleryImage && typeof galleryImage === 'object' && galleryImage.url ?
          toAbsoluteUrl(galleryImage.url)
        : undefined)

      const brandName =
        product.brand && typeof product.brand === 'object' && typeof product.brand.title === 'string' ?
          product.brand.title
        : undefined

      const description =
        (product as { seoContent?: { aiSummary?: string | null } }).seoContent?.aiSummary?.trim() ||
        (typeof product.meta?.description === 'string' ? product.meta.description.trim() : '') ||
        `Shop ${product.title} online in Bangladesh.`

      const identifiers = product.identifiers ?? {}
      const sku = identifiers.sku?.trim()
      const gtin = identifiers.gtin?.trim() || identifiers.gtin13?.trim()
      const mpn = identifiers.mpn?.trim()

      return {
        id: sku || slug,
        title: product.title,
        description: description.slice(0, 5000),
        link,
        ...(imageUrl ? { image_link: imageUrl } : {}),
        availability: hasStock ? 'in stock' : 'out of stock',
        price: `${typeof price === 'number' ? price.toFixed(2) : '0.00'} BDT`,
        ...(brandName ? { brand: brandName } : {}),
        condition: 'new',
        ...(gtin ? { gtin } : {}),
        ...(mpn ? { mpn } : {}),
        // Google requires gtin or brand+mpn; declare when neither exists.
        ...(!gtin && !(brandName && mpn) ? { identifier_exists: 'no' as const } : {}),
      } satisfies MerchantFeedItem
    })
}

export function merchantFeedToXml(items: MerchantFeedItem[]): string {
  const channelTitle = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const base = getServerSideURL()

  const itemXml = items
    .map((item) => {
      const fields = Object.entries(item)
        .map(([key, value]) => `<g:${key}>${escapeXml(String(value))}</g:${key}>`)
        .join('')
      return `<item>${fields}</item>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml('Product feed for Google Merchant Center and Meta catalogs')}</description>
    ${itemXml}
  </channel>
</rss>`
}

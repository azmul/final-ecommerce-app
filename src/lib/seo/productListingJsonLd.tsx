import type { Product } from '@/payload-types'

import { buildItemListJsonLd } from '@/lib/seo/buildItemListJsonLd'
import { JsonLd } from '@/lib/seo/JsonLd'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

export function ProductListingJsonLd({
  name,
  description,
  pageUrl,
  products,
}: {
  name: string
  description?: string
  pageUrl: string
  products: Product[]
}) {
  const base = getServerSideURL()
  const data = buildItemListJsonLd({
    name,
    description,
    url: pageUrl.startsWith('http') ? pageUrl : `${base}${pageUrl}`,
    items: products.slice(0, 48).map((product, index) => {
      const slug = typeof product.slug === 'string' ? product.slug : String(product.id)
      const galleryImage = product.gallery?.find((row) => row?.image && typeof row.image === 'object')
        ?.image
      const imageUrl =
        galleryImage && typeof galleryImage === 'object' && galleryImage.url ?
          toAbsoluteUrl(galleryImage.url)
        : undefined

      return {
        name: product.title,
        position: index + 1,
        url: `${base}/products/${slug}`,
        ...(imageUrl ? { image: imageUrl } : {}),
      }
    }),
  })

  if (!data) return null

  return <JsonLd data={data} />
}

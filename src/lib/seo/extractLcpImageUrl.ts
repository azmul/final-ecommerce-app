import type { Media, Page, Product } from '@/payload-types'

import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

function firstGalleryImage(product: Partial<Product>): Media | undefined {
  const image = product.gallery?.[0]?.image
  return image && typeof image === 'object' ? image : undefined
}

function mediaUrl(media: Media | undefined): string | undefined {
  if (!media?.url) return undefined
  return toAbsoluteUrl(media.url) ?? `${getServerSideURL()}${media.url}`
}

/** First likely LCP image from CMS page blocks (product grids / hero banners). */
export function extractLcpImageUrlFromLayout(layout: Page['layout']): string | undefined {
  if (!Array.isArray(layout)) return undefined

  for (const block of layout) {
    if (!block || typeof block !== 'object' || !('blockType' in block)) continue

    if (block.blockType === 'singleImageBanner' && 'image' in block) {
      const image = block.image
      if (image && typeof image === 'object') {
        const url = mediaUrl(image as Media)
        if (url) return url
      }
    }

    if (block.blockType === 'campaignHero' && 'image' in block) {
      const image = block.image
      if (image && typeof image === 'object') {
        const url = mediaUrl(image as Media)
        if (url) return url
      }
    }

    if (block.blockType === 'threeItemGrid' && Array.isArray(block.products)) {
      for (const product of block.products) {
        if (typeof product !== 'object' || !product) continue
        const metaImage =
          typeof product.meta?.image === 'object' ? (product.meta.image as Media) : undefined
        const url = mediaUrl(metaImage ?? firstGalleryImage(product))
        if (url) return url
      }
    }

    if (block.blockType === 'topSellingProducts' && Array.isArray(block.products)) {
      for (const product of block.products) {
        if (typeof product !== 'object' || !product) continue
        const url = mediaUrl(firstGalleryImage(product))
        if (url) return url
      }
    }
  }

  return undefined
}

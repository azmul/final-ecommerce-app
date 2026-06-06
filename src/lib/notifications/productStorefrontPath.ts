import type { AiProductResult } from '@/lib/ai/types'

/** Storefront product URL for chat cards and similar UI (never admin). */
export function productStorefrontPath(product: Pick<AiProductResult, 'slug' | 'url' | 'id'>): string {
  const slug = product.slug?.trim()
  if (slug) {
    return `/products/${slug}`
  }

  const url = product.url?.trim()
  if (url) {
    try {
      const path =
        url.startsWith('http://') || url.startsWith('https://') ?
          new URL(url).pathname
        : url.startsWith('/') ? url
        : `/${url}`
      if (path.startsWith('/products/')) {
        return path
      }
    } catch {
      //
    }
  }

  return `/shop`
}

import type { MetaContentItem, MetaCustomData } from '@/lib/analytics/meta/types'

export type ProductAnalyticsInput = {
  id: number | string
  slug?: string | null
  title?: string | null
  category?: string | null
  price?: number | null
  quantity?: number
  currency?: string
}

export function productContentId(product: ProductAnalyticsInput): string {
  if (product.slug && typeof product.slug === 'string') return product.slug
  return String(product.id)
}

export function toMetaContentItem(product: ProductAnalyticsInput): MetaContentItem {
  const id = productContentId(product)
  return {
    category: product.category ?? undefined,
    id,
    item_price: typeof product.price === 'number' ? product.price : undefined,
    quantity: product.quantity ?? 1,
    title: product.title ?? undefined,
  }
}

export function toMetaCustomDataFromProduct(
  product: ProductAnalyticsInput,
): MetaCustomData {
  const id = productContentId(product)
  const item = toMetaContentItem(product)
  const value =
    typeof product.price === 'number' ?
      product.price * (product.quantity ?? 1)
    : undefined

  return {
    content_category: product.category ?? undefined,
    content_ids: [id],
    content_name: product.title ?? undefined,
    content_type: 'product',
    contents: [item],
    currency: product.currency ?? 'BDT',
    ...(typeof value === 'number' ? { value } : {}),
  }
}

export function toMetaCustomDataFromProducts(
  products: ProductAnalyticsInput[],
  options?: { currency?: string; value?: number },
): MetaCustomData {
  const contents = products.map(toMetaContentItem)
  const value =
    options?.value ??
    products.reduce((sum, product) => {
      if (typeof product.price !== 'number') return sum
      return sum + product.price * (product.quantity ?? 1)
    }, 0)

  return {
    content_ids: contents.map((item) => item.id),
    content_type: 'product',
    contents,
    currency: options?.currency ?? products[0]?.currency ?? 'BDT',
    num_items: contents.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    ...(value > 0 ? { value } : {}),
  }
}

export function resolveProductCategory(
  categories: unknown,
): string | undefined {
  if (!Array.isArray(categories) || categories.length === 0) return undefined

  const first = categories[0]
  if (typeof first === 'object' && first && 'title' in first) {
    const title = (first as { title?: unknown }).title
    return typeof title === 'string' ? title : undefined
  }

  return undefined
}

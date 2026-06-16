import type { Product, Variant } from '@/payload-types'

export type CartLineItem = {
  product?: number | Product | null
  variant?: number | Variant | null
  quantity: number
}

export function cartLineToProductInput(item: CartLineItem): {
  id: number
  slug?: string | null
  title?: string | null
  price?: number | null
  quantity?: number
} | null {
  const product = item.product && typeof item.product === 'object' ? item.product : null
  if (!product) return null

  const variant = item.variant && typeof item.variant === 'object' ? item.variant : null
  const price =
    typeof variant?.priceInBDT === 'number' ? variant.priceInBDT
    : typeof product.priceInBDT === 'number' ? product.priceInBDT
    : null

  return {
    id: product.id,
    price,
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    slug: product.slug,
    title: product.title,
  }
}

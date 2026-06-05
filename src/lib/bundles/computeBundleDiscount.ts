import type { ProductBundle } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

type CartLine = {
  product?: number | null
  quantity?: number | null
  variant?: number | null
}

export type BundlePricedLine = {
  productId: number
  variantId: number | null
  quantity: number
  unitPrice: number
}

function lineKey(product: number, variant: number | null): string {
  return `${product}:${variant ?? 'none'}`
}

function resolveProductId(product: unknown): number | null {
  if (typeof product === 'number' && Number.isFinite(product)) return product
  if (product && typeof product === 'object' && 'id' in product) {
    const id = (product as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

function resolveVariantId(variant: unknown): number | null {
  if (!variant) return null
  if (typeof variant === 'number' && Number.isFinite(variant)) return variant
  if (typeof variant === 'object' && variant && 'id' in variant) {
    const id = (variant as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export async function buildBundlePricedLinesFromItems(args: {
  currency?: string
  items: CartLine[]
  payload: Payload
  req: PayloadRequest
}): Promise<BundlePricedLine[]> {
  const currency = args.currency ?? 'BDT'
  const priceField = `priceIn${currency}` as 'priceInBDT'
  const lines: BundlePricedLine[] = []

  for (const item of args.items) {
    const qty = typeof item.quantity === 'number' ? item.quantity : 0
    if (qty <= 0) continue

    const productId = resolveProductId(item.product)
    if (productId == null) continue

    const variantId = resolveVariantId(item.variant)
    let unitPrice: number | undefined

    if (variantId != null) {
      const variant = await args.payload.findByID({
        id: variantId,
        collection: 'variants',
        depth: 0,
        overrideAccess: true,
        req: args.req,
        select: { [priceField]: true },
      })
      unitPrice =
        variant && typeof variant === 'object' && priceField in variant ?
          (variant as Record<string, number | undefined>)[priceField]
        : undefined
    } else {
      const product = await args.payload.findByID({
        id: productId,
        collection: 'products',
        depth: 0,
        overrideAccess: true,
        req: args.req,
        select: { [priceField]: true },
      })
      unitPrice =
        product && typeof product === 'object' && priceField in product ?
          (product as Record<string, number | undefined>)[priceField]
        : undefined
    }

    if (typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice <= 0) continue

    lines.push({ productId, variantId, quantity: qty, unitPrice })
  }

  return lines
}

export function computeBundleDiscount(args: {
  bundle: ProductBundle
  cartLines: CartLine[]
  payableCap: number
  pricedLines: BundlePricedLine[]
}): number {
  const items = Array.isArray(args.bundle.items) ? args.bundle.items : []
  if (!items.length) return 0

  const required = new Map<string, number>()
  for (const item of items) {
    const productId = resolveProductId(item.product)
    if (productId == null) continue
    const variantId = resolveVariantId(item.variant)
    const qty = typeof item.quantity === 'number' ? item.quantity : 1
    const key = lineKey(productId, variantId)
    required.set(key, (required.get(key) ?? 0) + qty)
  }

  if (!required.size) return 0

  const inCart = new Map<string, number>()
  for (const line of args.cartLines) {
    const productId = resolveProductId(line.product)
    if (productId == null) continue
    const variantId = resolveVariantId(line.variant)
    const qty = typeof line.quantity === 'number' ? line.quantity : 0
    const key = lineKey(productId, variantId)
    inCart.set(key, (inCart.get(key) ?? 0) + qty)
  }

  for (const [key, qty] of required) {
    if ((inCart.get(key) ?? 0) < qty) return 0
  }

  const bundlePrice =
    typeof args.bundle.bundlePrice === 'number' ? args.bundle.bundlePrice : 0
  if (bundlePrice <= 0) return 0

  let bundleItemsSubtotal = 0
  for (const [key, requiredQty] of required) {
    const [productPart, variantPart] = key.split(':')
    const productId = Number(productPart)
    const variantId = variantPart === 'none' ? null : Number(variantPart)

    const priced = args.pricedLines.find(
      (line) => line.productId === productId && line.variantId === variantId,
    )
    if (!priced) return 0
    bundleItemsSubtotal += priced.unitPrice * requiredQty
  }

  if (bundleItemsSubtotal <= bundlePrice) return 0

  const discount = bundleItemsSubtotal - bundlePrice
  return Math.min(discount, Math.max(0, args.payableCap))
}

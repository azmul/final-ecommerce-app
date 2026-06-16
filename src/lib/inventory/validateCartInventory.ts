import type { Cart } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

import {
  resolveFulfillableInventory,
  type InventoryByLocationRow,
} from '@/lib/inventory/resolveAvailableInventory'
import { getReservedQuantity } from '@/lib/inventory/reservations'
import { OUT_OF_STOCK_MESSAGE, type InventoryValidationResult } from '@/lib/inventory/types'

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

type CartItemLike = NonNullable<Cart['items']>[number]

async function loadStockForLine(args: {
  district?: string | null
  payload: Payload
  req?: PayloadRequest
  item: CartItemLike
}): Promise<{
  available: number
  enableVariants: boolean
  productId: number
  productTitle: string
  variantId?: number
}> {
  const { district, payload, req, item } = args
  const productId = resolveRelationId(item.product)
  if (productId == null) {
    return { available: 0, enableVariants: false, productId: 0, productTitle: 'Product' }
  }

  let productTitle = 'Product'
  let enableVariants = false
  let embeddedProduct: Record<string, unknown> | null = null

  if (item.product && typeof item.product === 'object') {
    embeddedProduct = item.product as unknown as Record<string, unknown>
    if (typeof embeddedProduct.title === 'string') {
      productTitle = embeddedProduct.title
    }
    enableVariants = embeddedProduct.enableVariants === true
  }

  if (!embeddedProduct || embeddedProduct.inventory === undefined) {
    const product = await payload.findByID({
      id: productId,
      collection: 'products',
      depth: 0,
      overrideAccess: true,
      ...(req ? { req } : {}),
      select: {
        title: true,
        enableVariants: true,
        inventory: true,
        inventoryByLocation: true,
      },
    })
    if (product) {
      if (typeof product.title === 'string') productTitle = product.title
      enableVariants = product.enableVariants === true
      embeddedProduct = product as unknown as Record<string, unknown>
    }
  }

  const variantId = resolveRelationId(item.variant)

  if (enableVariants) {
    if (variantId == null) {
      return { available: 0, enableVariants: true, productId, productTitle, variantId: undefined }
    }

    if (item.variant && typeof item.variant === 'object') {
      return {
        available: resolveFulfillableInventory(
          item.variant as {
            inventory?: unknown
            inventoryByLocation?: InventoryByLocationRow[] | null
          },
          district,
        ),
        enableVariants: true,
        productId,
        productTitle,
        variantId,
      }
    }

    const variant = await payload.findByID({
      id: variantId,
      collection: 'variants',
      depth: 1,
      overrideAccess: true,
      ...(req ? { req } : {}),
      select: { inventory: true, inventoryByLocation: true },
    })

    return {
      available: variant ? resolveFulfillableInventory(variant, district) : 0,
      enableVariants: true,
      productId,
      productTitle,
      variantId,
    }
  }

  if (embeddedProduct) {
    return {
      available: resolveFulfillableInventory(
        embeddedProduct as {
          inventory?: unknown
          inventoryByLocation?: InventoryByLocationRow[] | null
        },
        district,
      ),
      enableVariants: false,
      productId,
      productTitle,
    }
  }

  return {
    available: 0,
    enableVariants: false,
    productId,
    productTitle,
  }
}

export async function validateCartInventory(args: {
  cartId?: number | null
  district?: string | null
  payload: Payload
  req?: PayloadRequest
  items: Cart['items'] | null | undefined
}): Promise<InventoryValidationResult> {
  const { cartId, district, payload, req, items } = args

  if (!items?.length) {
    return { ok: true }
  }

  const aggregated = new Map<string, { quantity: number; line: CartItemLike }>()

  for (const item of items) {
    const qty = typeof item.quantity === 'number' ? item.quantity : 0
    if (qty <= 0) continue

    const productId = resolveRelationId(item.product)
    const variantId = resolveRelationId(item.variant)
    const key = `${productId ?? 'x'}:${variantId ?? 'none'}`
    const existing = aggregated.get(key)
    if (existing) {
      existing.quantity += qty
    } else {
      aggregated.set(key, { quantity: qty, line: item })
    }
  }

  for (const { quantity, line } of aggregated.values()) {
    const stock = await loadStockForLine({ district, payload, req, item: line })

    if (stock.enableVariants && stock.variantId == null) {
      return {
        ok: false,
        code: 'OutOfStock',
        message: `Please select a variant for ${stock.productTitle}.`,
        productId: stock.productId,
        productTitle: stock.productTitle,
      }
    }

    const reserved = await getReservedQuantity({
      excludeCartId: cartId ?? null,
      payload,
      productId: stock.productId,
      req,
      variantId: stock.variantId ?? null,
    })
    const effectiveAvailable = Math.max(0, stock.available - reserved)

    if (quantity > effectiveAvailable) {
      return {
        ok: false,
        code: 'OutOfStock',
        message:
          effectiveAvailable <= 0 ?
            OUT_OF_STOCK_MESSAGE
          : `${stock.productTitle} has only ${effectiveAvailable} left in stock.`,
        productId: stock.productId,
        productTitle: stock.productTitle,
      }
    }
  }

  return { ok: true }
}

export function inventoryErrorPayload(result: Extract<InventoryValidationResult, { ok: false }>) {
  return JSON.stringify({
    message: result.message,
    cause: { code: result.code },
  })
}

import { verifyCartAccess } from '@/lib/carts/verifyCartAccess'
import {
  inventoryErrorPayload,
  validateCartInventory,
} from '@/lib/inventory/validateCartInventory'
import type { Cart, ProductBundle } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

type CartLineInput = NonNullable<Cart['items']>[number]

function resolveLineProductId(item: CartLineInput): number | null {
  const product = item.product
  if (typeof product === 'number' && Number.isFinite(product)) return product
  if (product && typeof product === 'object' && 'id' in product) {
    const id = product.id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

function resolveLineVariantId(item: CartLineInput): number | null {
  const variant = item.variant
  if (!variant) return null
  if (typeof variant === 'number' && Number.isFinite(variant)) return variant
  if (typeof variant === 'object' && 'id' in variant) {
    const id = variant.id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

function itemKey(item: CartLineInput): string {
  return `${resolveLineProductId(item)}:${resolveLineVariantId(item) ?? 'none'}`
}

function mergeCartItems(existing: CartLineInput[], additions: CartLineInput[]): CartLineInput[] {
  const merged = new Map<string, CartLineInput>()

  for (const item of [...existing, ...additions]) {
    const productId = resolveLineProductId(item)
    const variantId = resolveLineVariantId(item)
    const qty = typeof item.quantity === 'number' ? item.quantity : 0
    if (productId == null || qty <= 0) continue

    const key = itemKey(item)
    const prior = merged.get(key)
    merged.set(key, {
      product: productId,
      quantity: (prior?.quantity ?? 0) + qty,
      ...(variantId != null ? { variant: variantId } : {}),
    })
  }

  return [...merged.values()]
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const bundleId = Number(id)
  if (!Number.isFinite(bundleId)) {
    return NextResponse.json({ error: 'Invalid bundle id.' }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    cartId?: unknown
    secret?: unknown
  }
  const cartId = Number(body.cartId)
  if (!Number.isFinite(cartId)) {
    return NextResponse.json({ error: 'cartId is required.' }, { status: 400 })
  }

  const secret = typeof body.secret === 'string' ? body.secret : undefined

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  const userId = user?.id

  const bundle = (await payload.findByID({
    id: bundleId,
    collection: 'product-bundles',
    depth: 0,
    overrideAccess: true,
  })) as ProductBundle | null

  if (!bundle?.active || !bundle.items?.length) {
    return NextResponse.json({ error: 'Bundle not available.' }, { status: 404 })
  }

  const cart = await payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
  })

  if (!cart) {
    return NextResponse.json({ error: 'Cart not found.' }, { status: 404 })
  }

  const access = verifyCartAccess({ cart, secret, userId })
  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: 403 })
  }

  const existingItems = Array.isArray(cart.items) ? cart.items : []
  const bundleLines: CartLineInput[] = []

  for (const line of bundle.items) {
    const productId =
      typeof line.product === 'object' && line.product ?
        line.product.id
      : line.product
    const variantId =
      line.variant ?
        typeof line.variant === 'object' ?
          line.variant.id
        : line.variant
      : undefined
    bundleLines.push({
      product: productId,
      quantity: typeof line.quantity === 'number' ? line.quantity : 1,
      ...(variantId != null ? { variant: variantId } : {}),
    })
  }

  const mergedItems = mergeCartItems(existingItems, bundleLines)
  const inventoryCheck = await validateCartInventory({
    items: mergedItems,
    payload,
  })

  if (!inventoryCheck.ok) {
    return NextResponse.json(JSON.parse(inventoryErrorPayload(inventoryCheck)), { status: 400 })
  }

  await payload.update({
    id: cartId,
    collection: 'carts',
    data: {
      appliedBundle: bundleId,
      items: mergedItems,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
}

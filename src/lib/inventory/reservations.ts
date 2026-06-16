import type { Cart } from '@/payload-types'
import type { Payload, PayloadRequest, Where } from 'payload'

const RESERVATION_MINUTES = 15

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export async function releaseExpiredReservations(payload: Payload, req?: PayloadRequest): Promise<number> {
  const now = new Date().toISOString()
  const expired = await payload.find({
    collection: 'inventory-reservations',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    ...(req ? { req } : {}),
    where: {
      expiresAt: { less_than: now },
    },
  })

  for (const row of expired.docs) {
    await payload.delete({
      id: row.id,
      collection: 'inventory-reservations',
      overrideAccess: true,
      ...(req ? { req } : {}),
    })
  }

  return expired.docs.length
}

export async function getReservedQuantity(args: {
  excludeCartId?: number | null
  payload: Payload
  productId: number
  req?: PayloadRequest
  variantId?: number | null
}): Promise<number> {
  const { excludeCartId, payload, productId, req, variantId } = args
  const now = new Date().toISOString()

  const and: Where[] = [
    { product: { equals: productId } },
    { expiresAt: { greater_than: now } },
  ]

  if (variantId != null) {
    and.push({ variant: { equals: variantId } })
  } else {
    and.push({ variant: { exists: false } })
  }

  if (excludeCartId != null) {
    and.push({ cart: { not_equals: excludeCartId } })
  }

  const rows = await payload.find({
    collection: 'inventory-reservations',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    ...(req ? { req } : {}),
    where: { and },
  })

  return rows.docs.reduce((sum, row) => sum + (typeof row.quantity === 'number' ? row.quantity : 0), 0)
}

export async function syncReservationsForCart(args: {
  cartId: number
  items: Cart['items'] | null | undefined
  payload: Payload
  req?: PayloadRequest
}): Promise<void> {
  const { cartId, items, payload, req } = args

  await releaseExpiredReservations(payload, req)

  const existing = await payload.find({
    collection: 'inventory-reservations',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    ...(req ? { req } : {}),
    where: { cart: { equals: cartId } },
  })

  for (const row of existing.docs) {
    await payload.delete({
      id: row.id,
      collection: 'inventory-reservations',
      overrideAccess: true,
      ...(req ? { req } : {}),
    })
  }

  if (!items?.length) return

  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString()

  for (const item of items) {
    const productId = resolveRelationId(item.product)
    if (productId == null) continue
    const variantId = resolveRelationId(item.variant)
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0
    if (quantity <= 0) continue

    await payload.create({
      collection: 'inventory-reservations',
      data: {
        cart: cartId,
        expiresAt,
        product: productId,
        quantity,
        ...(variantId != null ? { variant: variantId } : {}),
      },
      overrideAccess: true,
      ...(req ? { req } : {}),
    })
  }
}

export async function clearReservationsForCart(args: {
  cartId: number
  payload: Payload
  req?: PayloadRequest
}): Promise<void> {
  const rows = await args.payload.find({
    collection: 'inventory-reservations',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
    where: { cart: { equals: args.cartId } },
  })

  for (const row of rows.docs) {
    await args.payload.delete({
      id: row.id,
      collection: 'inventory-reservations',
      overrideAccess: true,
      ...(args.req ? { req: args.req } : {}),
    })
  }
}

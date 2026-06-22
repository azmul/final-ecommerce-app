import type { Cart } from '@/payload-types'
import type { Payload, PayloadRequest, Where } from 'payload'

const RESERVATION_MINUTES = 15

// Fixed namespaced key for the reservation critical-section advisory lock.
const RESERVATION_LOCK_CLASS = 0x7265_7376 // "resv"
const RESERVATION_LOCK_KEY = 1

type WithPool = { pool?: { connect: () => Promise<PoolClient> } }
type PoolClient = {
  query: (text: string, values?: unknown[]) => Promise<unknown>
  release: () => void
}

/**
 * Runs `fn` while holding a Postgres session-level advisory lock so that
 * concurrent reservation operations are serialized — preventing the
 * read-reserved-then-write oversell race. The lock and unlock run on the same
 * explicitly-held pool client, which is required for advisory locks to be
 * reliable over a connection pool.
 *
 * Falls back to running `fn` without a lock if the pool is unavailable (e.g.
 * a non-postgres adapter in tests) rather than failing the request.
 */
export async function withReservationLock<T>(payload: Payload, fn: () => Promise<T>): Promise<T> {
  const pool = (payload.db as unknown as WithPool).pool
  if (!pool) return fn()

  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1, $2)', [
      RESERVATION_LOCK_CLASS,
      RESERVATION_LOCK_KEY,
    ])
    return await fn()
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1, $2)', [
        RESERVATION_LOCK_CLASS,
        RESERVATION_LOCK_KEY,
      ])
    } catch {
      // best-effort unlock; the lock is released on connection close regardless
    }
    client.release()
  }
}

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

  // Sum across ALL active reservations (paginate) — a fixed limit would
  // under-count reserved stock for popular products and allow oversell.
  let total = 0
  let page = 1
  for (;;) {
    const rows = await payload.find({
      collection: 'inventory-reservations',
      depth: 0,
      limit: 500,
      page,
      overrideAccess: true,
      ...(req ? { req } : {}),
      where: { and },
    })
    total += rows.docs.reduce(
      (sum, row) => sum + (typeof row.quantity === 'number' ? row.quantity : 0),
      0,
    )
    if (!rows.hasNextPage) break
    page += 1
  }

  return total
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

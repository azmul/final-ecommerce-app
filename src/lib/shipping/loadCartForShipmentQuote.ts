import type { Cart } from '@/payload-types'
import type { Payload } from 'payload'

function toNumericId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw)) {
    return Number(raw)
  }
  return null
}

export function productIdFromLineItem(
  product: NonNullable<Cart['items']>[number]['product'] | unknown,
): number | null {
  if (product == null) {
    return null
  }
  if (typeof product === 'number') {
    return toNumericId(product)
  }
  if (typeof product === 'string') {
    return toNumericId(product)
  }
  if (typeof product === 'object' && 'id' in product) {
    return toNumericId((product as { id: unknown }).id)
  }
  return null
}

async function resolveShipmentDoc(payload: Payload, raw: unknown): Promise<unknown> {
  const sid = toNumericId(raw)
  if (sid == null) {
    return raw
  }
  try {
    const doc = await payload.findByID({
      collection: 'shipments',
      depth: 0,
      id: sid,
      overrideAccess: true,
    })
    return doc ?? raw
  } catch {
    return raw
  }
}

/**
 * Load product with `shipment` as a full document (not only an id).
 * Draft-enabled products may store `shipment` only on the latest draft — merge that when needed.
 */
async function loadProductWithShipmentResolved(
  payload: Payload,
  productId: number,
): Promise<NonNullable<Cart['items']>[number]['product'] | null> {
  const load = async (opts: { draft?: boolean }) => {
    try {
      return await payload.findByID({
        collection: 'products',
        depth: 2,
        id: productId,
        overrideAccess: true,
        ...opts,
      })
    } catch {
      return null
    }
  }

  let doc = await load({})
  let draftDoc = null as Awaited<ReturnType<typeof load>>

  const shipmentMissing = (p: typeof doc) =>
    !p ||
    p.shipment === null ||
    p.shipment === undefined

  if (shipmentMissing(doc)) {
    draftDoc = await load({ draft: true })
    if (draftDoc && draftDoc.shipment != null && draftDoc.shipment !== undefined) {
      doc = doc ? { ...doc, shipment: draftDoc.shipment } : draftDoc
    } else if (!doc && draftDoc) {
      doc = draftDoc
    }
  }

  if (!doc) {
    return null
  }

  let shipment: unknown = doc.shipment
  if (typeof shipment === 'number' || typeof shipment === 'string') {
    shipment = await resolveShipmentDoc(payload, shipment)
  }

  const merged = {
    ...doc,
    shipment,
  }

  return merged as NonNullable<Cart['items']>[number]['product']
}

/**
 * Full cart for shipment math: keep cart line items (variants, etc.) but replace each `product`
 * with a hydrated product so `shipment` is always a document when configured in admin.
 */
export async function loadCartForShipmentQuote(
  payload: Payload,
  cartID: number,
): Promise<Cart | null> {
  let doc: Record<string, unknown> | null = null
  try {
    doc = (await payload.findByID({
      collection: 'carts',
      depth: 3,
      id: cartID,
      overrideAccess: true,
    })) as unknown as Record<string, unknown> | null
  } catch {
    doc = null
  }

  if (!doc || typeof doc !== 'object') {
    return null
  }

  const cart = doc as unknown as Cart
  const items = cart.items
  if (!items?.length) {
    return cart
  }

  const productIds = new Set<number>()
  for (const item of items) {
    const id = productIdFromLineItem(item.product)
    if (id != null) {
      productIds.add(id)
    }
  }

  const byProductId = new Map<number, NonNullable<Cart['items']>[number]['product']>()

  await Promise.all(
    [...productIds].map(async (id) => {
      const hydrated = await loadProductWithShipmentResolved(payload, id)
      if (hydrated && typeof hydrated === 'object') {
        byProductId.set(id, hydrated)
      }
    }),
  )

  const mergedItems = items.map((item) => {
    const id = productIdFromLineItem(item.product)
    if (id == null) {
      return item
    }
    const hydrated = byProductId.get(id)
    if (!hydrated || typeof hydrated !== 'object') {
      return item
    }
    return {
      ...item,
      product: hydrated,
    }
  })

  return {
    ...cart,
    items: mergedItems,
  }
}

import type { Cart, Shipment } from '@/payload-types'
import type { Payload } from 'payload'

import type { CustomerDeliveryPrefs } from '@/lib/shipping/customerDeliveryPrefs'
import { shipmentMajorToStoreMinor } from '@/lib/shipping/currencyScale'
import {
  computeChargesForShipmentGroup,
  type ShipmentChargeLine,
} from '@/lib/shipping/shipmentPricing'

export type CartLineForShipping = {
  cartItemIndex: number
  productId: number
  productTitle: string
  variantId?: number | null
  quantity: number
  shipment: Shipment | null
  unitPriceBdt: number
}

/** One shipment profile applied to combined cart quantities for checkout. */
export type ShipmentGroupCheckoutLine = {
  shipmentId: number | null
  shipmentName: string | null
  totalQuantity: number
  cartLines: CartLineForShipping[]
  freeDelivery: boolean
  baseChargeBdt: number
  cumulativeChargeBdt: number
  cumulativeSteps: number
  chargeLines: ShipmentChargeLine[]
  shippingTotalBdt: number
  /** Share of cart `subtotal` (after promo) */
  allocatedMerchandiseSubtotalBdt: number
  /** Merchandise + shipping for one split order */
  orderTotalBdt: number
}

export type CheckoutShippingQuoteSuccess = {
  ok: true
  prefs: CustomerDeliveryPrefs
  shipmentGroups: ShipmentGroupCheckoutLine[]
  merchandiseSubtotalBdt: number
  totalShippingBdt: number
  grandTotalBdt: number
  orderCount: number
}

export type CheckoutShippingQuoteFailure = {
  ok: false
  message: string
  missingProductTitles?: string[]
}

export type CheckoutShippingQuote = CheckoutShippingQuoteSuccess | CheckoutShippingQuoteFailure

export function getLineUnitPriceBdt(currency: string, item: NonNullable<Cart['items']>[number]): number {
  const field = `priceIn${currency.toUpperCase()}` as 'priceInBDT'
  const variant = item.variant
  if (variant && typeof variant === 'object' && variant[field] != null) {
    const v = Number(variant[field])
    if (Number.isFinite(v)) return v
  }
  const product = item.product
  if (product && typeof product === 'object' && product[field] != null) {
    const v = Number(product[field])
    if (Number.isFinite(v)) return v
  }
  return 0
}

export function groupCartLinesByShipment(lines: CartLineForShipping[]): Map<string, CartLineForShipping[]> {
  const map = new Map<string, CartLineForShipping[]>()
  for (const line of lines) {
    const key = line.shipment?.id != null ? String(line.shipment.id) : 'unassigned'
    const arr = map.get(key)
    if (arr) arr.push(line)
    else map.set(key, [line])
  }
  return map
}

function totalQtyInGroup(groupLines: CartLineForShipping[]): number {
  return groupLines.reduce((sum, l) => sum + Math.max(0, Math.floor(Number(l.quantity))), 0)
}

function rawSubtotalForGroup(groupLines: CartLineForShipping[]): number {
  let s = 0
  for (const l of groupLines) {
    const q = Math.max(0, Math.floor(Number(l.quantity)))
    s += q * l.unitPriceBdt
  }
  return Math.round(s * 100) / 100
}

/** Allocate post-promo cart subtotal across groups by raw merchandise ratios. */
export function allocateMerchandiseAcrossGroups(
  groupsRaw: number[],
  cartMerchandiseAfterPromoBdt: number,
): number[] {
  const n = groupsRaw.length
  if (n === 0) return []
  const cartRounded = Math.round(Math.max(0, cartMerchandiseAfterPromoBdt) * 100) / 100
  const sum = groupsRaw.reduce((a, b) => a + b, 0)
  if (sum <= 0) {
    const even = Math.round((cartRounded * 100) / n) / 100
    const out = Array.from({ length: n }, () => even)
    const drift = cartRounded - out.reduce((a, b) => a + b, 0)
    out[n - 1] = Math.round((out[n - 1] + drift) * 100) / 100
    return out
  }
  const allocated = groupsRaw.map(
    (raw) => Math.round(((raw / sum) * cartRounded) * 100) / 100,
  )
  const drift = cartRounded - allocated.reduce((a, b) => a + b, 0)
  allocated[n - 1] = Math.round((allocated[n - 1] + drift) * 100) / 100
  return allocated
}

export function flattenOrderItemsFromGroup(lines: CartLineForShipping[]): {
  product: number
  variant?: number
  quantity: number
}[] {
  return lines.map((l) => ({
    product: l.productId,
    ...(l.variantId != null ? { variant: l.variantId } : {}),
    quantity: l.quantity,
  }))
}

async function fetchShipmentDoc(payload: Payload, id: number): Promise<Shipment | null> {
  try {
    const doc = await payload.findByID({
      collection: 'shipments',
      depth: 0,
      id,
      overrideAccess: true,
    })
    if (doc) return doc as Shipment
  } catch {
    /* try find fallback */
  }
  try {
    const res = await payload.find({
      collection: 'shipments',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { id: { equals: id } },
    })
    const first = res.docs[0]
    return first ? (first as Shipment) : null
  } catch {
    return null
  }
}

/** Resolve relationship id or partial populated row to a full Shipment for pricing. */
async function resolveShipmentForQuote(payload: Payload, raw: unknown): Promise<Shipment | null> {
  if (raw === null || raw === undefined) return null

  if (typeof raw === 'object') {
    const partial = raw as Partial<Shipment>
    const hasPricingShape =
      typeof partial.shippingName === 'string' ||
      typeof partial.freeDelivery === 'boolean' ||
      typeof partial.dhakaHomeDeliveryCharge === 'number'
    if (hasPricingShape) {
      return raw as Shipment
    }
    if (typeof partial.id === 'number' && Number.isFinite(partial.id)) {
      return (await fetchShipmentDoc(payload, partial.id)) ?? (raw as Shipment)
    }
    return null
  }

  const id =
    typeof raw === 'number' && Number.isFinite(raw) ? raw
    : typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw)
    : null
  if (id == null) return null

  return fetchShipmentDoc(payload, id)
}

export async function buildCheckoutShippingQuote(args: {
  cart: Cart
  currency: string
  prefs: CustomerDeliveryPrefs
  payload: Payload
}): Promise<CheckoutShippingQuote> {
  const { cart, currency, prefs, payload } = args
  const items = cart.items
  if (!items?.length) {
    return { ok: false, message: 'Cart is empty.' }
  }

  const lines: CartLineForShipping[] = []
  const missing: string[] = []

  for (let cartItemIndex = 0; cartItemIndex < items.length; cartItemIndex++) {
    const item = items[cartItemIndex]
    const product = item.product
    if (!product || typeof product !== 'object') {
      missing.push(`Line ${cartItemIndex + 1}`)
      continue
    }

    const title =
      typeof product.title === 'string' && product.title.trim() ? product.title : `Product ${product.id}`

    const qty = Math.max(0, Math.floor(Number(item.quantity)))
    if (qty < 1) continue

    const shipment = await resolveShipmentForQuote(payload, product.shipment)
    if (!shipment || typeof shipment !== 'object') {
      missing.push(title)
      continue
    }

    const variantId =
      item.variant && typeof item.variant === 'object' ? item.variant.id
      : typeof item.variant === 'number' ?
        item.variant
      : null

    lines.push({
      cartItemIndex,
      productId: product.id,
      productTitle: title,
      variantId,
      quantity: qty,
      shipment,
      unitPriceBdt: Math.round(getLineUnitPriceBdt(currency, item) * 100) / 100,
    })
  }

  if (missing.length) {
    return {
      ok: false,
      message: 'Every product must have a shipment profile selected in the admin.',
      missingProductTitles: [...new Set(missing)],
    }
  }

  const byShipment = groupCartLinesByShipment(lines)
  const groupValues = [...byShipment.values()]
  const rawSubtotals = groupValues.map(rawSubtotalForGroup)
  const cartMerch = Math.max(0, Number(cart.subtotal ?? 0))
  const allocatedMerch = allocateMerchandiseAcrossGroups(rawSubtotals, cartMerch)

  const shipmentGroups: ShipmentGroupCheckoutLine[] = []
  let totalShipping = 0
  let grandTotal = 0

  groupValues.forEach((groupLines, index) => {
    const primaryShipment = groupLines[0]?.shipment ?? null
    const totalQty = totalQtyInGroup(groupLines)
    const chargeBlock = computeChargesForShipmentGroup({
      shipment: primaryShipment,
      totalQuantity: totalQty,
      prefs,
    })

    const shippingTotalMinor = shipmentMajorToStoreMinor(chargeBlock.totalBdt, currency)
    totalShipping += shippingTotalMinor

    const allocated = allocatedMerch[index] ?? 0
    const scaledBase = shipmentMajorToStoreMinor(chargeBlock.baseChargeBdt, currency)
    const scaledCumulative = shipmentMajorToStoreMinor(chargeBlock.cumulativeChargeBdt, currency)

    const chargeLines: ShipmentChargeLine[] = chargeBlock.lines.map((ln) => ({
      label: ln.label,
      amountBdt: shipmentMajorToStoreMinor(ln.amountBdt, currency),
    }))
    chargeLines.push({
      label: 'Merchandise (after discounts, this shipment group)',
      amountBdt: allocated,
    })

    const orderTotal = allocated + shippingTotalMinor
    grandTotal += orderTotal

    shipmentGroups.push({
      shipmentId: primaryShipment?.id ?? null,
      shipmentName: primaryShipment?.shippingName ?? null,
      totalQuantity: totalQty,
      cartLines: groupLines,
      freeDelivery: chargeBlock.freeDelivery,
      baseChargeBdt: scaledBase,
      cumulativeChargeBdt: scaledCumulative,
      cumulativeSteps: chargeBlock.cumulativeSteps,
      chargeLines,
      shippingTotalBdt: shippingTotalMinor,
      allocatedMerchandiseSubtotalBdt: allocated,
      orderTotalBdt: orderTotal,
    })
  })

  const grandRounded = grandTotal
  const shipRounded = totalShipping

  return {
    ok: true,
    prefs,
    shipmentGroups,
    merchandiseSubtotalBdt: cartMerch,
    totalShippingBdt: shipRounded,
    grandTotalBdt: grandRounded,
    orderCount: shipmentGroups.length,
  }
}

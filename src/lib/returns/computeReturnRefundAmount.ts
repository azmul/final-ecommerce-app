import type { Order, ReturnRequest } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

function resolveOrderItemId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function applyProductDiscount(price: number, discount?: number | null): number {
  const pct = typeof discount === 'number' ? Math.min(Math.max(Math.round(discount), 0), 100) : 0
  return pct > 0 ? Math.round(price * (100 - pct)) : price
}

type OrderLineSnapshot = {
  orderItemId: string
  orderedQty: number
  productId: number
  unitPrice: number
  variantId?: number | null
}

export type ReturnRefundComputation = {
  isFullReturn: boolean
  refundAmount?: number
  refundRatio: number
}

async function resolveLineUnitPrice(args: {
  currency: string
  payload: Payload
  productId: number
  req?: PayloadRequest
  variantId?: number | null
}): Promise<number> {
  const field = `priceIn${args.currency.toUpperCase()}` as 'priceInBDT'

  const product = await args.payload.findByID({
    id: args.productId,
    collection: 'products',
    depth: 0,
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
    select: {
      discountPercentage: true,
      priceInBDT: true,
    },
  })

  if (!product) return 0

  if (args.variantId != null) {
    const variant = await args.payload.findByID({
      id: args.variantId,
      collection: 'variants',
      depth: 0,
      overrideAccess: true,
      ...(args.req ? { req: args.req } : {}),
      select: {
        priceInBDT: true,
      },
    })

    const variantPrice =
      variant && typeof variant === 'object' && field in variant ?
        Number((variant as Record<string, unknown>)[field])
      : NaN

    if (Number.isFinite(variantPrice) && variantPrice > 0) {
      return applyProductDiscount(variantPrice, product.discountPercentage)
    }
  }

  const productPrice =
    typeof product === 'object' && field in product ?
      Number((product as Record<string, unknown>)[field])
    : NaN

  if (!Number.isFinite(productPrice) || productPrice <= 0) return 0
  return applyProductDiscount(productPrice, product.discountPercentage)
}

async function buildOrderLineSnapshots(args: {
  currency: string
  order: Order
  payload: Payload
  req?: PayloadRequest
}): Promise<OrderLineSnapshot[]> {
  const orderItems = Array.isArray(args.order.items) ? args.order.items : []
  const lines: OrderLineSnapshot[] = []

  for (const item of orderItems) {
    const orderItemId = resolveOrderItemId(item.id)
    const productId = resolveRelationId(item.product)
    if (!orderItemId || productId == null) continue

    const variantId = resolveRelationId(item.variant)
    const orderedQty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
    const unitPrice = await resolveLineUnitPrice({
      currency: args.currency,
      payload: args.payload,
      productId,
      req: args.req,
      variantId,
    })

    lines.push({
      orderItemId,
      orderedQty,
      productId,
      unitPrice,
      variantId,
    })
  }

  return lines
}

function lineMerchandiseTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity)
}

export function isFullOrderReturn(
  orderLines: OrderLineSnapshot[],
  returnItems: NonNullable<ReturnRequest['items']>,
): boolean {
  if (!orderLines.length || !returnItems?.length) return false

  const returnedByLine = new Map<string, number>()
  for (const item of returnItems) {
    const orderItemId = resolveOrderItemId(item.orderItemId)
    const qty = typeof item.quantity === 'number' ? item.quantity : 0
    if (!orderItemId || qty <= 0) return false

    const line = orderLines.find((entry) => entry.orderItemId === orderItemId)
    if (!line) return false

    returnedByLine.set(orderItemId, (returnedByLine.get(orderItemId) ?? 0) + qty)
  }

  for (const line of orderLines) {
    if ((returnedByLine.get(line.orderItemId) ?? 0) < line.orderedQty) {
      return false
    }
  }

  return true
}

export async function computeReturnRefundAmount(args: {
  order: Order
  payload: Payload
  req?: PayloadRequest
  returnRequest: ReturnRequest
}): Promise<ReturnRefundComputation> {
  const { order, payload, req, returnRequest } = args
  const orderAmount = typeof order.amount === 'number' && order.amount > 0 ? order.amount : undefined

  if (!orderAmount) {
    return { isFullReturn: false, refundRatio: 0 }
  }

  if (returnRequest.requestType === 'cancel') {
    return {
      isFullReturn: true,
      refundAmount: orderAmount,
      refundRatio: 1,
    }
  }

  const returnItems = Array.isArray(returnRequest.items) ? returnRequest.items : []
  if (!returnItems.length) {
    return { isFullReturn: false, refundRatio: 0 }
  }

  const currency = (order.currency ?? 'BDT').toUpperCase()
  const orderLines = await buildOrderLineSnapshots({ currency, order, payload, req })

  if (!orderLines.length) {
    return { isFullReturn: false, refundRatio: 0 }
  }

  if (isFullOrderReturn(orderLines, returnItems)) {
    return {
      isFullReturn: true,
      refundAmount: orderAmount,
      refundRatio: 1,
    }
  }

  let orderMerchTotal = 0
  for (const line of orderLines) {
    orderMerchTotal += lineMerchandiseTotal(line.unitPrice, line.orderedQty)
  }

  let returnMerchTotal = 0
  for (const item of returnItems) {
    const orderItemId = resolveOrderItemId(item.orderItemId)
    const returnQty = typeof item.quantity === 'number' ? item.quantity : 0
    if (!orderItemId || returnQty <= 0) continue

    const line = orderLines.find((entry) => entry.orderItemId === orderItemId)
    if (!line) continue

    const cappedQty = Math.min(returnQty, line.orderedQty)
    returnMerchTotal += lineMerchandiseTotal(line.unitPrice, cappedQty)
  }

  if (returnMerchTotal <= 0) {
    const orderQty = orderLines.reduce((sum, line) => sum + line.orderedQty, 0)
    const returnQty = returnItems.reduce(
      (sum, item) => sum + (typeof item.quantity === 'number' ? item.quantity : 0),
      0,
    )

    if (orderQty <= 0 || returnQty <= 0) {
      return { isFullReturn: false, refundRatio: 0 }
    }

    const refundRatio = Math.min(1, returnQty / orderQty)
    return {
      isFullReturn: false,
      refundAmount: Math.max(1, Math.min(orderAmount, Math.round(orderAmount * refundRatio))),
      refundRatio,
    }
  }

  if (orderMerchTotal <= 0) {
    return { isFullReturn: false, refundRatio: 0 }
  }

  const refundRatio = Math.min(1, returnMerchTotal / orderMerchTotal)
  return {
    isFullReturn: false,
    refundAmount: Math.max(1, Math.min(orderAmount, Math.round(orderAmount * refundRatio))),
    refundRatio,
  }
}

import { verifyOrderAccess } from '@/lib/chat/orderAccess'
import {
  canSubmitRequestType,
  orderCancelWindowExpiredMessage,
  resolveEligibleRequestTypes,
  type ReturnRequestReason,
  RETURN_REQUEST_REASONS,
} from '@/lib/orders/returnRequestEligibility'
import type { Order } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const VALID_REASONS = new Set<string>(RETURN_REQUEST_REASONS.map((option) => option.value))

type RequestItemInput = {
  orderItemId?: unknown
  quantity?: unknown
}

type Body = {
  accessToken?: unknown
  details?: unknown
  items?: RequestItemInput[]
  orderId?: unknown
  photoMediaIds?: unknown
  reason?: unknown
  requestType?: unknown
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

const MIN_CANCEL_REASON_LENGTH = 3
const MAX_CANCEL_REASON_LENGTH = 1000

function resolveCancelReasonInput(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length < MIN_CANCEL_REASON_LENGTH || trimmed.length > MAX_CANCEL_REASON_LENGTH) {
    return null
  }
  return trimmed
}

function resolveReturnReasonInput(value: unknown): ReturnRequestReason | null {
  if (typeof value !== 'string' || !VALID_REASONS.has(value)) {
    return null
  }
  return value as ReturnRequestReason
}

function resolveOrderItemId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function buildRequestItems(order: Order, itemsInput?: RequestItemInput[]) {
  const orderItems = Array.isArray(order.items) ? order.items : []
  if (!orderItems.length) return []

  if (!itemsInput?.length) {
    return orderItems
      .map((item) => {
        const orderItemId = resolveOrderItemId(item.id)
        const productId =
          typeof item.product === 'object' && item.product ?
            item.product.id
          : item.product
        if (!orderItemId || !productId || !Number.isFinite(Number(productId))) return null

        const variantId =
          item.variant ?
            typeof item.variant === 'object' ?
              item.variant.id
            : item.variant
          : undefined

        return {
          orderItemId,
          product: Number(productId),
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          ...(variantId != null && Number.isFinite(Number(variantId)) ?
            { variant: Number(variantId) }
          : {}),
        }
      })
      .filter(Boolean) as {
      orderItemId: string
      product: number
      quantity: number
      variant?: number
    }[]
  }

  const built: {
    orderItemId: string
    product: number
    quantity: number
    variant?: number
  }[] = []

  for (const input of itemsInput) {
    const orderItemId = resolveOrderItemId(input.orderItemId)
    const quantity = Number(input.quantity)
    if (!orderItemId || !Number.isFinite(quantity) || quantity < 1) {
      throw new Error('Each item needs a valid orderItemId and quantity.')
    }

    const line = orderItems.find((item) => resolveOrderItemId(item.id) === orderItemId)
    if (!line) {
      throw new Error('One or more items do not belong to this order.')
    }

    const maxQty = typeof line.quantity === 'number' ? line.quantity : 1
    if (quantity > maxQty) {
      throw new Error('Requested quantity exceeds what was ordered.')
    }

    const productId =
      typeof line.product === 'object' && line.product ?
        line.product.id
      : line.product
    if (!productId || !Number.isFinite(Number(productId))) {
      throw new Error('Order item product is missing.')
    }

    const variantId =
      line.variant ?
        typeof line.variant === 'object' ?
          line.variant.id
        : line.variant
      : undefined

    built.push({
      orderItemId,
      product: Number(productId),
      quantity,
      ...(variantId != null && Number.isFinite(Number(variantId)) ?
        { variant: Number(variantId) }
      : {}),
    })
  }

  return built
}

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  const url = new URL(request.url)
  const orderId = Number(url.searchParams.get('orderId'))
  const accessToken =
    typeof url.searchParams.get('accessToken') === 'string' ?
      url.searchParams.get('accessToken')!.trim()
    : ''

  if (!Number.isFinite(orderId)) {
    return jsonError('orderId is required.', 400)
  }

  const order = await verifyOrderAccess({
    accessToken,
    orderId,
    payload,
    user: auth.user,
  })

  if (!order) {
    return jsonError('Order not found.', 404)
  }

  const result = await payload.find({
    collection: 'return-requests',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      order: {
        equals: order.id,
      },
    },
  })

  return NextResponse.json({
    docs: result.docs,
    eligibleTypes: resolveEligibleRequestTypes(order),
  })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError('Invalid JSON.', 400)
  }

  const orderId = Number(body.orderId)
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : ''
  const requestType = body.requestType === 'cancel' || body.requestType === 'return' ? body.requestType : null
  const details = typeof body.details === 'string' ? body.details.trim() : ''

  if (!Number.isFinite(orderId) || !requestType) {
    return jsonError('orderId and requestType are required.', 400)
  }

  let reason: ReturnRequestReason
  let requestDetails = details

  if (requestType === 'cancel') {
    const cancelReason = resolveCancelReasonInput(body.reason)
    if (!cancelReason) {
      return jsonError('Please describe why you are cancelling this order.', 400)
    }
    reason = 'other'
    requestDetails = cancelReason
  } else {
    const returnReason = resolveReturnReasonInput(body.reason)
    if (!returnReason) {
      return jsonError('Please select a reason for your return.', 400)
    }
    reason = returnReason
  }

  const order = await verifyOrderAccess({
    accessToken,
    orderId,
    payload,
    user: auth.user,
  })

  if (!order) {
    return jsonError('Order not found.', 404)
  }

  if (!canSubmitRequestType(order, requestType)) {
    if (
      requestType === 'cancel' &&
      order.status === 'processing'
    ) {
      return jsonError(orderCancelWindowExpiredMessage(), 400)
    }

    return jsonError('This request type is not available for the current order status.', 400)
  }

  const openRequests = await payload.find({
    collection: 'return-requests',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { order: { equals: order.id } },
        { status: { equals: 'pending' } },
      ],
    },
  })

  if (openRequests.totalDocs > 0) {
    return jsonError('A request for this order is already pending review.', 409)
  }

  let items
  try {
    items = buildRequestItems(order, body.items)
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Invalid items.', 400)
  }

  if (!items.length) {
    return jsonError('Order has no returnable items.', 400)
  }

  const photoMediaIds = Array.isArray(body.photoMediaIds) ?
      body.photoMediaIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    : []

  const created = await payload.create({
    collection: 'return-requests',
    data: {
      customer: auth.user?.id,
      details: requestDetails,
      guestEmail: auth.user ? undefined : (order.customerEmail ?? undefined),
      items,
      order: order.id,
      photos: photoMediaIds.length ? photoMediaIds : undefined,
      reason: reason as ReturnRequestReason,
      requestType,
      status: 'pending',
    },
    overrideAccess: true,
  })

  return NextResponse.json({ doc: created, ok: true })
}

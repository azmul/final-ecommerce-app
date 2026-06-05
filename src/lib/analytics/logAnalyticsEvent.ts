import type { Payload, PayloadRequest } from 'payload'

export type AnalyticsEventType =
  | 'product_view'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'

export type LogAnalyticsEventInput = {
  cartId?: number
  eventType: AnalyticsEventType
  metadata?: Record<string, unknown>
  orderId?: number
  productId?: number
  sessionId?: string
  userId?: number
}

export async function logAnalyticsEvent(
  payload: Payload,
  input: LogAnalyticsEventInput,
  req?: PayloadRequest,
) {
  return payload.create({
    collection: 'analytics-events',
    data: {
      ...(input.cartId ? { cart: input.cartId } : {}),
      eventType: input.eventType,
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.orderId ? { order: input.orderId } : {}),
      ...(input.productId ? { product: input.productId } : {}),
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      ...(input.userId ? { user: input.userId } : {}),
    },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })
}

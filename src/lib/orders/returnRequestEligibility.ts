import type { Order } from '@/payload-types'

export type ReturnRequestType = 'cancel' | 'return'

export const ORDER_CANCEL_WINDOW_HOURS = 12
export const ORDER_CANCEL_WINDOW_MS = ORDER_CANCEL_WINDOW_HOURS * 60 * 60 * 1000

type FulfillmentOrderStatus =
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export const RETURN_REQUEST_REASONS = [
  { label: 'Changed my mind', value: 'changed_mind' },
  { label: 'Wrong item received', value: 'wrong_item' },
  { label: 'Damaged or defective', value: 'damaged' },
  { label: 'Not as described', value: 'not_as_described' },
  { label: 'Missing parts', value: 'missing_parts' },
  { label: 'Other', value: 'other' },
] as const

export type ReturnRequestReason = (typeof RETURN_REQUEST_REASONS)[number]['value']

const CANCEL_ELIGIBLE: FulfillmentOrderStatus[] = ['processing']
const RETURN_ELIGIBLE: FulfillmentOrderStatus[] = ['shipped', 'delivered', 'completed']
const BLOCKED: FulfillmentOrderStatus[] = ['cancelled', 'refunded']

export function getOrderCreatedAtMs(order: Pick<Order, 'createdAt'>): number | null {
  if (!order.createdAt) return null
  const ms = Date.parse(order.createdAt)
  return Number.isFinite(ms) ? ms : null
}

/** Last moment a customer can submit a cancellation request for this order. */
export function getOrderCancelDeadline(order: Pick<Order, 'createdAt'>): Date | null {
  const createdMs = getOrderCreatedAtMs(order)
  if (createdMs == null) return null
  return new Date(createdMs + ORDER_CANCEL_WINDOW_MS)
}

export function isWithinOrderCancelWindow(
  order: Pick<Order, 'createdAt'>,
  nowMs: number = Date.now(),
): boolean {
  const createdMs = getOrderCreatedAtMs(order)
  if (createdMs == null) return false
  return nowMs - createdMs <= ORDER_CANCEL_WINDOW_MS
}

export function resolveEligibleRequestTypes(
  order: Order,
  nowMs: number = Date.now(),
): ReturnRequestType[] {
  const status = order.status as FulfillmentOrderStatus | null | undefined
  if (!status || BLOCKED.includes(status)) return []

  const types: ReturnRequestType[] = []
  if (CANCEL_ELIGIBLE.includes(status) && isWithinOrderCancelWindow(order, nowMs)) {
    types.push('cancel')
  }
  if (RETURN_ELIGIBLE.includes(status)) types.push('return')
  return types
}

export function canSubmitRequestType(
  order: Order,
  requestType: ReturnRequestType,
  nowMs: number = Date.now(),
): boolean {
  return resolveEligibleRequestTypes(order, nowMs).includes(requestType)
}

export function orderCancelWindowExpiredMessage(): string {
  return `Order cancellation is only available within ${ORDER_CANCEL_WINDOW_HOURS} hours of placing your order.`
}

export function requestTypeLabel(requestType: ReturnRequestType): string {
  return requestType === 'cancel' ? 'Cancel order' : 'Return / refund'
}

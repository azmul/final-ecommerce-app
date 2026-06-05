import type { Order } from '@/payload-types'

export type ReturnRequestType = 'cancel' | 'return'

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

export function resolveEligibleRequestTypes(order: Order): ReturnRequestType[] {
  const status = order.status as FulfillmentOrderStatus | null | undefined
  if (!status || BLOCKED.includes(status)) return []

  const types: ReturnRequestType[] = []
  if (CANCEL_ELIGIBLE.includes(status)) types.push('cancel')
  if (RETURN_ELIGIBLE.includes(status)) types.push('return')
  return types
}

export function canSubmitRequestType(order: Order, requestType: ReturnRequestType): boolean {
  return resolveEligibleRequestTypes(order).includes(requestType)
}

export function requestTypeLabel(requestType: ReturnRequestType): string {
  return requestType === 'cancel' ? 'Cancel order' : 'Return / refund'
}

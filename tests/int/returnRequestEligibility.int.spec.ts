import { describe, expect, it } from 'vitest'

import {
  ORDER_CANCEL_WINDOW_MS,
  canSubmitRequestType,
  getOrderCancelDeadline,
  isWithinOrderCancelWindow,
  orderCancelWindowExpiredMessage,
  resolveEligibleRequestTypes,
} from '@/lib/orders/returnRequestEligibility'
import type { Order } from '@/payload-types'

function processingOrder(createdAt: string): Order {
  return {
    id: 1,
    createdAt,
    status: 'processing',
    updatedAt: createdAt,
  } as Order
}

describe('order cancel window', () => {
  const createdAt = '2026-06-06T10:00:00.000Z'
  const createdMs = Date.parse(createdAt)

  it('allows cancel while processing and within 12 hours', () => {
    const order = processingOrder(createdAt)
    const nowMs = createdMs + ORDER_CANCEL_WINDOW_MS - 60_000

    expect(isWithinOrderCancelWindow(order, nowMs)).toBe(true)
    expect(resolveEligibleRequestTypes(order, nowMs)).toEqual(['cancel'])
    expect(canSubmitRequestType(order, 'cancel', nowMs)).toBe(true)
  })

  it('blocks cancel after 12 hours even when still processing', () => {
    const order = processingOrder(createdAt)
    const nowMs = createdMs + ORDER_CANCEL_WINDOW_MS + 1

    expect(isWithinOrderCancelWindow(order, nowMs)).toBe(false)
    expect(resolveEligibleRequestTypes(order, nowMs)).toEqual([])
    expect(canSubmitRequestType(order, 'cancel', nowMs)).toBe(false)
  })

  it('returns cancel deadline 12 hours after order creation', () => {
    const order = processingOrder(createdAt)

    expect(getOrderCancelDeadline(order)?.toISOString()).toBe(
      new Date(createdMs + ORDER_CANCEL_WINDOW_MS).toISOString(),
    )
  })

  it('still allows returns after cancel window closes', () => {
    const order = {
      ...processingOrder(createdAt),
      status: 'completed',
    } as Order
    const nowMs = createdMs + ORDER_CANCEL_WINDOW_MS + 1

    expect(resolveEligibleRequestTypes(order, nowMs)).toEqual(['return'])
  })

  it('includes hours in the expired message', () => {
    expect(orderCancelWindowExpiredMessage()).toContain('12')
  })
})

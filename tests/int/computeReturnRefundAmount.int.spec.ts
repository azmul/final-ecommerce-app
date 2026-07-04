import { describe, expect, it } from 'vitest'

import {
  computeReturnRefundAmount,
  isFullOrderReturn,
} from '@/lib/returns/computeReturnRefundAmount'
import type { Order, ReturnRequest } from '@/payload-types'
import type { Payload } from 'payload'

const orderLines = [
  {
    orderItemId: 'line-a',
    orderedQty: 2,
    productId: 10,
    unitPrice: 1000,
    variantId: null,
  },
  {
    orderItemId: 'line-b',
    orderedQty: 1,
    productId: 11,
    unitPrice: 2000,
    variantId: null,
  },
]

describe('computeReturnRefundAmount', () => {
  it('detects a full order return', () => {
    const full = isFullOrderReturn(orderLines, [
      { orderItemId: 'line-a', product: 10, quantity: 2 },
      { orderItemId: 'line-b', product: 11, quantity: 1 },
    ])

    expect(full).toBe(true)
  })

  it('detects a partial return', () => {
    const partial = isFullOrderReturn(orderLines, [
      { orderItemId: 'line-a', product: 10, quantity: 1 },
    ])

    expect(partial).toBe(false)
  })

  it('refunds the full order amount for cancellations', async () => {
    const order = {
      amount: 5000,
      currency: 'BDT',
      items: [],
    } as unknown as Order

    const returnRequest = {
      requestType: 'cancel',
      items: [],
    } as unknown as ReturnRequest

    const result = await computeReturnRefundAmount({
      order,
      payload: {} as Payload,
      returnRequest,
    })

    expect(result).toEqual({
      isFullReturn: true,
      refundAmount: 5000,
      refundRatio: 1,
    })
  })

  it('refunds proportionally for partial merchandise returns', async () => {
    const order = {
      amount: 5000,
      currency: 'BDT',
      items: [
        { id: 'line-a', product: 10, quantity: 2 },
        { id: 'line-b', product: 11, quantity: 1 },
      ],
    } as Order

    const returnRequest = {
      requestType: 'return',
      items: [{ orderItemId: 'line-a', product: 10, quantity: 1 }],
    } as ReturnRequest

    const payload = {
      findByID: async ({ collection, id }: { collection: string; id: number }) => {
        if (collection === 'products' && id === 10) {
          return { discountPercentage: 0, priceInBDT: 1000 }
        }
        if (collection === 'products' && id === 11) {
          return { discountPercentage: 0, priceInBDT: 2000 }
        }
        return null
      },
    } as unknown as Payload

    const result = await computeReturnRefundAmount({
      order,
      payload,
      returnRequest,
    })

    expect(result.isFullReturn).toBe(false)
    expect(result.refundRatio).toBeCloseTo(1000 / 4000, 5)
    expect(result.refundAmount).toBe(Math.round(5000 * (1000 / 4000)))
  })

  it('refunds the full order amount when every line is returned in full', async () => {
    const order = {
      amount: 5000,
      currency: 'BDT',
      items: [
        { id: 'line-a', product: 10, quantity: 2 },
        { id: 'line-b', product: 11, quantity: 1 },
      ],
    } as Order

    const returnRequest = {
      requestType: 'return',
      items: [
        { orderItemId: 'line-a', product: 10, quantity: 2 },
        { orderItemId: 'line-b', product: 11, quantity: 1 },
      ],
    } as ReturnRequest

    const payload = {
      findByID: async ({ collection, id }: { collection: string; id: number }) => {
        if (collection === 'products' && id === 10) {
          return { discountPercentage: 0, priceInBDT: 1000 }
        }
        if (collection === 'products' && id === 11) {
          return { discountPercentage: 0, priceInBDT: 2000 }
        }
        return null
      },
    } as unknown as Payload

    const result = await computeReturnRefundAmount({
      order,
      payload,
      returnRequest,
    })

    expect(result).toEqual({
      isFullReturn: true,
      refundAmount: 5000,
      refundRatio: 1,
    })
  })
})

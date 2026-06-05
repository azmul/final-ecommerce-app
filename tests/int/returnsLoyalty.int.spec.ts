import { returnItemsToInventoryLines } from '@/lib/inventory/incrementInventoryForItems'
import { inventoryErrorPayload } from '@/lib/inventory/validateCartInventory'
import { describe, expect, it } from 'vitest'

describe('return and bundle helpers', () => {
  it('returnItemsToInventoryLines maps return request items', () => {
    const lines = returnItemsToInventoryLines([
      { product: 10, quantity: 2 },
      { product: { id: 11 }, variant: { id: 5 }, quantity: 1 },
      { product: 12, quantity: 0 },
    ])

    expect(lines).toEqual([
      { product: 10, quantity: 2 },
      { product: 11, variant: 5, quantity: 1 },
    ])
  })

  it('inventoryErrorPayload serializes out-of-stock responses', () => {
    const payload = JSON.parse(
      inventoryErrorPayload({
        ok: false,
        code: 'OutOfStock',
        message: 'Widget has only 1 left in stock.',
        productId: 3,
        productTitle: 'Widget',
      }),
    )

    expect(payload.message).toBe('Widget has only 1 left in stock.')
    expect(payload.cause.code).toBe('OutOfStock')
  })
})

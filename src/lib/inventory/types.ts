export const OUT_OF_STOCK_MESSAGE = 'This product is out of stock'

export type InventoryOrderItem = {
  product: number
  variant?: number
  quantity: number
}

export type InventoryValidationResult =
  | { ok: true }
  | {
      ok: false
      code: 'OutOfStock'
      message: string
      productId?: number
      productTitle?: string
    }

import { assertInventoryBeforeOrder } from '@/lib/inventory/assertInventoryBeforeOrder'
import type { Cart } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'

export const assertInventoryBeforeCreate: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipInventoryAssert) {
    return data
  }

  const shippingAddress = data.shippingAddress as { district?: string | null } | undefined
  const district =
    shippingAddress && typeof shippingAddress.district === 'string' ?
      shippingAddress.district
    : null

  const items = data.items as Cart['items'] | undefined

  // Exclude this checkout's own reservation (created on the checkout page) so the
  // buyer's held stock doesn't count against them — otherwise last-unit orders
  // falsely fail as out of stock. Mirrors the reserve-inventory route.
  const checkoutCart = (data as { checkoutCart?: unknown }).checkoutCart
  const cartId =
    typeof checkoutCart === 'number' ? checkoutCart
    : checkoutCart && typeof checkoutCart === 'object' && 'id' in checkoutCart ?
      ((checkoutCart as { id?: unknown }).id as number | undefined) ?? null
    : null

  await assertInventoryBeforeOrder({
    cartId,
    district,
    items,
    payload: req.payload,
    req,
  })

  return data
}

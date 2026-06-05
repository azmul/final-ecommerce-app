import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
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

  await assertInventoryBeforeOrder({
    district,
    items,
    payload: req.payload,
    req,
  })

  return data
}

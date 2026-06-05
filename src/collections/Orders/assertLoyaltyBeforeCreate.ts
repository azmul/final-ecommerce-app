import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import { getLoyaltyBalance } from '@/lib/loyalty/getLoyaltyBalance'
import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

function resolveCustomerId(data: Record<string, unknown>): number | null {
  const customer = data.customer
  if (typeof customer === 'number' && Number.isFinite(customer)) return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    const id = (customer as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export const assertLoyaltyBeforeCreate: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipLoyaltyAssert) {
    return data
  }

  const cartId = await resolveOrderCartId(data as Record<string, unknown>, req)
  if (!cartId) return data

  const cart = await req.payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (!cart) return data

  const points = typeof cart.appliedLoyaltyPoints === 'number' ? cart.appliedLoyaltyPoints : 0
  if (points <= 0) return data

  const userId = resolveCustomerId(data as Record<string, unknown>)
  if (userId == null) return data

  const balance = await getLoyaltyBalance({
    payload: req.payload,
    req,
    userId,
  })

  if (balance < points) {
    throw new APIError(
      JSON.stringify({
        message: 'Insufficient loyalty points for this order.',
        cause: { code: 'LoyaltyInsufficient' },
      }),
      400,
    )
  }

  return data
}

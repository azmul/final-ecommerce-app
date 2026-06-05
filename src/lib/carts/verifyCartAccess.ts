import type { Cart } from '@/payload-types'
import { constantTimeEquals } from '@/utilities/edgeRateLimit'

export function verifyCartAccess(args: {
  cart: Cart
  secret?: string | null
  userId?: number | null
}): { ok: true } | { message: string; ok: false } {
  const cartCustomer =
    typeof args.cart.customer === 'number' ? args.cart.customer
    : typeof args.cart.customer === 'object' && args.cart.customer ?
      args.cart.customer.id
    : null

  const cartSecret = typeof args.cart.secret === 'string' ? args.cart.secret : ''

  if (args.userId != null) {
    if (cartCustomer != null && cartCustomer !== args.userId) {
      return { ok: false, message: 'You do not have access to this cart.' }
    }
    if (cartCustomer == null && (!args.secret || !constantTimeEquals(args.secret, cartSecret))) {
      return { ok: false, message: 'Valid cart secret is required for this cart.' }
    }
    return { ok: true }
  }

  if (!args.secret || !constantTimeEquals(args.secret, cartSecret)) {
    return { ok: false, message: 'Valid cart secret is required for guest checkout.' }
  }

  return { ok: true }
}

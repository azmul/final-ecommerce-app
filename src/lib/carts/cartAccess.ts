import { constantTimeEquals } from '@/utilities/edgeRateLimit'
import type { Payload } from 'payload'

type CartOwnershipArgs = {
  payload: Payload
  cartId: number
  userId?: number | null
  secret?: string | null
}

/**
 * True when the caller may access `cartId`: a signed-in user who owns the cart,
 * or anyone (guest, or a signed-in user with an unlinked guest cart) presenting
 * the matching cart secret.
 *
 * Mirrors the checkout shipping-quote gate so AI/chat surfaces cannot read an
 * arbitrary cart (subtotal, item counts, applied codes) simply by supplying its
 * id. Uses a constant-time secret comparison to avoid a timing side-channel.
 */
export async function callerOwnsCart(args: CartOwnershipArgs): Promise<boolean> {
  const { cartId, payload, secret, userId } = args

  if (!Number.isFinite(cartId) || cartId < 1) return false

  const cart = await payload
    .findByID({ collection: 'carts', depth: 0, id: cartId, overrideAccess: true })
    .catch(() => null)

  if (!cart) return false

  const cartCustomer =
    typeof cart.customer === 'number' ? cart.customer
    : cart.customer && typeof cart.customer === 'object' && 'id' in cart.customer ?
      Number((cart.customer as { id: number }).id)
    : null

  const cartSecret = typeof cart.secret === 'string' ? cart.secret : ''

  // A linked cart can only be reached by its owner.
  if (userId != null && cartCustomer != null) {
    return cartCustomer === userId
  }

  // Guest cart (or a signed-in user acting on an unlinked cart): require the secret.
  return Boolean(secret && cartSecret && constantTimeEquals(secret, cartSecret))
}

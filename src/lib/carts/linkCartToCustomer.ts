import { readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import type { Cart } from '@/payload-types'

export async function linkCartToCustomer(args: {
  cart: Cart
  secret?: string
  userId: number
}): Promise<boolean> {
  const secret = args.secret?.trim() || readGuestCartSecret(args.cart)

  const body: Record<string, unknown> = {
    cartID: args.cart.id,
  }
  if (secret) {
    body.secret = secret
  }

  const response = await fetch('/api/checkout/link-cart', {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  return response.ok
}

import {
  cartRequiresGuestSecret,
  getCheckoutCartSecret,
  syncGuestCartSecretFromCart,
} from '@/lib/carts/guestCartSecret'
import { linkCartToCustomer } from '@/lib/carts/linkCartToCustomer'
import type { Cart } from '@/payload-types'

export type CheckoutCartAccess = {
  cartSecret?: string
  needsCartSecret: boolean
}

/** Resolves guest secret vs owned cart before shipping quote or payment. */
export async function resolveCheckoutCartAccess(args: {
  cart?: Cart | null
  refreshCart?: () => Promise<void>
  userId?: number | null
}): Promise<CheckoutCartAccess> {
  syncGuestCartSecretFromCart(args.cart)

  let cartSecret = getCheckoutCartSecret(args.cart)
  let needsCartSecret = cartRequiresGuestSecret({
    cart: args.cart,
    userId: args.userId,
  })

  if (args.userId != null && needsCartSecret && args.cart?.id) {
    const linked = await linkCartToCustomer({
      cart: args.cart,
      secret: cartSecret,
      userId: args.userId,
    })

    if (linked) {
      try {
        await args.refreshCart?.()
      } catch {
        // Server linked the cart; payment can proceed without a client refresh.
      }
      needsCartSecret = false
      cartSecret = undefined
    } else {
      cartSecret = getCheckoutCartSecret(args.cart)
    }
  }

  return { cartSecret, needsCartSecret }
}

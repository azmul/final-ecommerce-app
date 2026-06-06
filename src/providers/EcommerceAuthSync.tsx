'use client'

import { backupGuestCartSecret, cartRequiresGuestSecret } from '@/lib/carts/guestCartSecret'
import { linkCartToCustomer } from '@/lib/carts/linkCartToCustomer'
import { useAuth } from '@/providers/Auth'
import { useCart, useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect, useRef } from 'react'

/**
 * Keeps EcommerceProvider session in sync with AuthProvider (login, logout, /me).
 * Address and cart helpers in the ecommerce client read `user` from EcommerceProvider only.
 */
export function EcommerceAuthSync() {
  const { status, user: authUser } = useAuth()
  const { cart, refreshCart } = useCart()
  const { onLogin, onLogout, user: ecommerceUser } = useEcommerce()
  const syncInFlight = useRef(false)

  useEffect(() => {
    if (status === 'loggedOut') {
      onLogout()
      return
    }

    if (!authUser?.id) {
      return
    }

    const userSynced = ecommerceUser?.id === authUser.id
    const cartNeedsLink = cartRequiresGuestSecret({
      cart,
      userId: authUser.id,
    })

    if (userSynced && !cartNeedsLink) {
      return
    }

    if (syncInFlight.current) {
      return
    }

    syncInFlight.current = true
    const preservedSecret = backupGuestCartSecret()

    void (async () => {
      try {
        if (!userSynced) {
          await onLogin()
        }

        if (authUser.id && cart?.id && cartRequiresGuestSecret({ cart, userId: authUser.id })) {
          const linked = await linkCartToCustomer({
            cart,
            secret: preservedSecret,
            userId: authUser.id,
          })

          if (linked) {
            await refreshCart()
          }
        }
      } catch {
        // Checkout can retry linking before quoting shipping.
      } finally {
        syncInFlight.current = false
      }
    })()
  }, [
    authUser?.id,
    cart,
    ecommerceUser?.id,
    onLogin,
    onLogout,
    refreshCart,
    status,
  ])

  return null
}

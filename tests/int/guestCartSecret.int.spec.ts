import { describe, expect, it } from 'vitest'

import {
  backupGuestCartSecret,
  cartRequiresGuestSecret,
  getCheckoutCartSecret,
  GUEST_CART_SECRET_SESSION_KEY,
  GUEST_CART_SECRET_STORAGE_KEY,
  readGuestCartSecret,
  syncGuestCartSecretFromCart,
} from '@/lib/carts/guestCartSecret'
import type { Cart } from '@/payload-types'

describe('guestCartSecret', () => {
  it('reads secret from localStorage', () => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(GUEST_CART_SECRET_STORAGE_KEY, 'abc-123')
    expect(readGuestCartSecret({ id: 1 } as Cart)).toBe('abc-123')
  })

  it('falls back to session backup after login clears localStorage', () => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(GUEST_CART_SECRET_STORAGE_KEY, 'backup-me')
    backupGuestCartSecret()
    localStorage.removeItem(GUEST_CART_SECRET_STORAGE_KEY)
    expect(readGuestCartSecret()).toBe('backup-me')
    expect(sessionStorage.getItem(GUEST_CART_SECRET_SESSION_KEY)).toBe('backup-me')
  })

  it('requires secret for guest carts', () => {
    expect(cartRequiresGuestSecret({ cart: { id: 1, customer: null } as Cart })).toBe(true)
  })

  it('does not require secret when cart belongs to signed-in user', () => {
    expect(
      cartRequiresGuestSecret({
        cart: { id: 1, customer: 5 } as Cart,
        userId: 5,
      }),
    ).toBe(false)
  })

  it('requires secret when logged in but cart is still unlinked', () => {
    expect(
      cartRequiresGuestSecret({
        cart: { id: 1, customer: null } as Cart,
        userId: 5,
      }),
    ).toBe(true)
  })

  it('reads secret from cart when present on the document', () => {
    localStorage.clear()
    sessionStorage.clear()
    expect(readGuestCartSecret({ id: 1, secret: 'from-doc' } as Cart)).toBe('from-doc')
  })

  it('getCheckoutCartSecret persists cart secret then reads it', () => {
    localStorage.clear()
    sessionStorage.clear()
    expect(getCheckoutCartSecret({ id: 1, secret: 'checkout-me' } as Cart)).toBe('checkout-me')
    expect(localStorage.getItem(GUEST_CART_SECRET_STORAGE_KEY)).toBe('checkout-me')
  })

  it('persists cart secret to storage when syncing from create response', () => {
    localStorage.clear()
    sessionStorage.clear()
    expect(syncGuestCartSecretFromCart({ id: 1, secret: 'persist-me' } as Cart)).toBe('persist-me')
    expect(localStorage.getItem(GUEST_CART_SECRET_STORAGE_KEY)).toBe('persist-me')
    expect(sessionStorage.getItem(GUEST_CART_SECRET_SESSION_KEY)).toBe('persist-me')
  })
})

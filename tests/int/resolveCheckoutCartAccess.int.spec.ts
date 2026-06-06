import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveCheckoutCartAccess } from '@/lib/carts/resolveCheckoutCartAccess'
import type { Cart } from '@/payload-types'

describe('resolveCheckoutCartAccess', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('returns secret for guest carts without calling link-cart', async () => {
    localStorage.setItem('cart_secret', 'guest-secret')

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveCheckoutCartAccess({
      cart: { id: 1, customer: null } as Cart,
    })

    expect(result).toEqual({
      cartSecret: 'guest-secret',
      needsCartSecret: true,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not require secret when cart belongs to the signed-in user', async () => {
    const result = await resolveCheckoutCartAccess({
      cart: { id: 1, customer: 9 } as Cart,
      userId: 9,
    })

    expect(result).toEqual({
      cartSecret: undefined,
      needsCartSecret: false,
    })
  })

  it('links unowned carts for signed-in users when link-cart succeeds', async () => {
    localStorage.setItem('cart_secret', 'link-me')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    const refreshCart = vi.fn().mockResolvedValue(undefined)

    const result = await resolveCheckoutCartAccess({
      cart: { id: 42, customer: null } as Cart,
      refreshCart,
      userId: 5,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/checkout/link-cart',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(refreshCart).toHaveBeenCalledOnce()
    expect(result).toEqual({
      cartSecret: undefined,
      needsCartSecret: false,
    })
  })
})

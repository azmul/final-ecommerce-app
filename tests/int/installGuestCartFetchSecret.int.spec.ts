import { afterEach, describe, expect, it, vi } from 'vitest'

import { installGuestCartFetchSecret } from '@/lib/carts/installGuestCartFetchSecret'

describe('installGuestCartFetchSecret', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    sessionStorage.clear()
    delete (window as Window & { __guestCartFetchSecretPatch?: boolean }).__guestCartFetchSecretPatch
  })

  it('appends stored secret to GET /api/carts/:id when cart id matches', async () => {
    localStorage.setItem('cart', '51')
    localStorage.setItem('cart_secret', 'guest-secret')

    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    installGuestCartFetchSecret()

    await fetch('/api/carts/51?depth=3')

    expect(fetchMock).toHaveBeenCalledOnce()
    const calledUrl = String(fetchMock.mock.calls[0]?.[0])
    expect(calledUrl).toContain('secret=guest-secret')
  })

  it('does not append secret for a different cart id', async () => {
    localStorage.setItem('cart', '51')
    localStorage.setItem('cart_secret', 'guest-secret')

    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    installGuestCartFetchSecret()

    await fetch('/api/carts/99?depth=3')

    expect(fetchMock).toHaveBeenCalledOnce()
    const calledUrl = String(fetchMock.mock.calls[0]?.[0])
    expect(calledUrl).not.toContain('secret=')
  })

  it('reads session backup secret after login clears localStorage', async () => {
    localStorage.setItem('cart', '51')
    sessionStorage.setItem('cart_secret_pending_link', 'session-secret')

    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    installGuestCartFetchSecret()

    await fetch('/api/carts/51')

    const calledUrl = String(fetchMock.mock.calls[0]?.[0])
    expect(calledUrl).toContain('secret=session-secret')
  })
})

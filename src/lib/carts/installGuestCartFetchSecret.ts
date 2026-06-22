import { GUEST_CART_SECRET_SESSION_KEY, GUEST_CART_SECRET_STORAGE_KEY } from '@/lib/carts/guestCartSecret'

/** Payload ecommerce `syncLocalStorage` cart id key (default `cart`). */
const ECOMMERCE_CART_ID_STORAGE_KEY = 'cart'

const PATCH_FLAG = '__guestCartFetchSecretPatch'

function readStoredCartSecret(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const fromLocal = localStorage.getItem(GUEST_CART_SECRET_STORAGE_KEY)?.trim()
  if (fromLocal) return fromLocal

  const fromSession = sessionStorage.getItem(GUEST_CART_SECRET_SESSION_KEY)?.trim()
  if (fromSession) return fromSession

  return undefined
}

function appendSecretToCartGetUrl(url: string, cartId: string): string | null {
  if (!url.includes('/api/carts/') || url.includes('secret=')) {
    return null
  }

  const storedCartId = localStorage.getItem(ECOMMERCE_CART_ID_STORAGE_KEY)?.trim()
  if (!storedCartId || storedCartId !== cartId) {
    return null
  }

  const secret = readStoredCartSecret()
  if (!secret) {
    return null
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}secret=${encodeURIComponent(secret)}`
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function resolveRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase()
  if (input instanceof Request) return input.method.toUpperCase()
  return 'GET'
}

/**
 * Payload ecommerce `refreshCart()` omits the guest cart secret on GET /api/carts/:id.
 * Patch fetch so stored secrets are appended for the active cart id.
 */
export function installGuestCartFetchSecret(): void {
  if (typeof window === 'undefined') return
  if ((window as Window & { [PATCH_FLAG]?: boolean })[PATCH_FLAG]) return

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = resolveRequestMethod(input, init)
    if (method !== 'GET') {
      return originalFetch(input, init)
    }

    const url = resolveRequestUrl(input)
    const match = url.match(/\/api\/carts\/(\d+)(?:\?|$)/)
    if (!match) {
      return originalFetch(input, init)
    }

    const patchedUrl = appendSecretToCartGetUrl(url, match[1])
    if (!patchedUrl) {
      return originalFetch(input, init)
    }

    if (typeof input === 'string' || input instanceof URL) {
      return originalFetch(patchedUrl, init)
    }

    return originalFetch(new Request(patchedUrl, input), init)
  }

  ;(window as Window & { [PATCH_FLAG]?: boolean })[PATCH_FLAG] = true
}

import type { Cart } from '@/payload-types'

/** Matches Payload ecommerce `syncLocalStorage` key (`cart` → `cart_secret`). */
export const GUEST_CART_SECRET_STORAGE_KEY = 'cart_secret'

/** Survives ecommerce `onLogin` clearing `cart_secret` from localStorage. */
export const GUEST_CART_SECRET_SESSION_KEY = 'cart_secret_pending_link'

function resolveCartCustomerId(cart: Cart | null | undefined): number | null {
  const customer = cart?.customer
  if (typeof customer === 'number' && Number.isFinite(customer)) return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    const id = customer.id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export const CHECKOUT_CART_ACCESS_ERROR =
  'We could not access your cart. Try refreshing the page or adding the item again.'

/** Guest or unlinked carts need the secret for API access. */
export function cartRequiresGuestSecret(args: {
  cart?: Cart | null
  userId?: number | null
}): boolean {
  const cartCustomerId = resolveCartCustomerId(args.cart)
  if (args.userId != null && cartCustomerId != null && cartCustomerId === args.userId) {
    return false
  }
  return true
}

export function readGuestCartSecret(cart?: Cart | null): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const fromCart = typeof cart?.secret === 'string' ? cart.secret.trim() : ''
  if (fromCart) {
    return fromCart
  }

  const stored = localStorage.getItem(GUEST_CART_SECRET_STORAGE_KEY)
  if (stored?.trim()) {
    return stored.trim()
  }

  const sessionBackup = sessionStorage.getItem(GUEST_CART_SECRET_SESSION_KEY)
  if (sessionBackup?.trim()) {
    return sessionBackup.trim()
  }

  return undefined
}

/** Ensures cart create secrets are persisted, then returns the best available secret. */
export function getCheckoutCartSecret(cart?: Cart | null): string | undefined {
  syncGuestCartSecretFromCart(cart)
  return readGuestCartSecret(cart)
}

export function persistGuestCartSecret(secret: string): void {
  if (typeof window === 'undefined') return
  const trimmed = secret.trim()
  if (!trimmed) return
  localStorage.setItem(GUEST_CART_SECRET_STORAGE_KEY, trimmed)
  sessionStorage.setItem(GUEST_CART_SECRET_SESSION_KEY, trimmed)
}

export function backupGuestCartSecret(): string | undefined {
  const secret = readGuestCartSecret()
  if (!secret || typeof window === 'undefined') {
    return undefined
  }

  sessionStorage.setItem(GUEST_CART_SECRET_SESSION_KEY, secret)
  return secret
}

export function clearGuestCartSecretStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_CART_SECRET_STORAGE_KEY)
  sessionStorage.removeItem(GUEST_CART_SECRET_SESSION_KEY)
}

export function syncGuestCartSecretFromCart(cart?: Cart | null): string | undefined {
  const fromCart = typeof cart?.secret === 'string' ? cart.secret.trim() : ''
  if (fromCart) {
    persistGuestCartSecret(fromCart)
    return fromCart
  }

  return readGuestCartSecret(cart)
}

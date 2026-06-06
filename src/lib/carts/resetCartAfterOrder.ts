import { clearGuestCartSecretStorage } from '@/lib/carts/guestCartSecret'

/**
 * Drop checkout cart state after a successful order.
 * Uses ecommerce `clearSession` (client-only) so we do not POST `/carts/:id/clear` on an
 * already-purchased cart, which Payload logs as a 404 when access fails.
 * Logged-in shoppers are re-synced by `EcommerceAuthSync` via `onLogin`.
 */
export function resetCartAfterOrder(args: {
  clearSession?: () => void
}): void {
  clearGuestCartSecretStorage()
  args.clearSession?.()
}

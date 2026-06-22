import { getServerSideURL } from '@/utilities/getURL'

/**
 * CSRF defense for cookie-authenticated, state-changing custom routes.
 *
 * Cross-site requests ride the victim's cookies, but the browser sets a
 * trustworthy `Origin` (and usually `Referer`) header that a cross-site
 * attacker cannot forge. We require it to match our own server origin.
 * Same-origin requests from the app always send a matching Origin, so this is
 * transparent to legitimate traffic.
 */
export function isSameOrigin(request: Request): boolean {
  const allowed = new URL(getServerSideURL()).origin

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).origin === allowed
    } catch {
      return false
    }
  }

  // Fall back to Referer when Origin is absent (some same-origin GETs/old UAs).
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).origin === allowed
    } catch {
      return false
    }
  }

  // No Origin and no Referer: reject for state-changing requests (fail closed).
  return false
}

/**
 * Guard against the /admin/login → /admin redirect loop that appears when the
 * middleware trusts a decodable auth cookie but Payload's server-side auth
 * rejects it (e.g. CSRF origin mismatch from a stale NEXT_PUBLIC_SERVER_URL
 * build, or a rotated PAYLOAD_SECRET). Counts middleware redirects in a
 * short-lived cookie; past the threshold the middleware must stop redirecting
 * and clear the auth cookie so the real login form renders.
 *
 * A visit only counts as a loop bounce when it re-arrives within
 * ADMIN_LOGIN_GUARD_BOUNCE_GAP_MS of the previous redirect — real loops bounce
 * sub-second, while a logged-in admin re-opening /admin/login at a human pace
 * resets the sequence instead of being force-logged-out.
 */
export const ADMIN_LOGIN_GUARD_COOKIE_NAME = 'admin-login-guard'
export const ADMIN_LOGIN_GUARD_MAX_REDIRECTS = 3
export const ADMIN_LOGIN_GUARD_WINDOW_SECONDS = 30
export const ADMIN_LOGIN_GUARD_BOUNCE_GAP_MS = 10_000

export type AdminLoginGuardState = {
  count: number
  lastRedirectAt: number
}

/** Cookie format: `<count>:<epochMs>`. Malformed or future-stamped values are ignored. */
export function parseAdminLoginGuardCookie(
  value: string | undefined | null,
  now: number,
): AdminLoginGuardState | null {
  if (!value) return null

  const [countRaw, lastRedirectAtRaw] = value.split(':')
  const count = Number.parseInt(countRaw ?? '', 10)
  const lastRedirectAt = Number.parseInt(lastRedirectAtRaw ?? '', 10)

  if (!Number.isFinite(count) || count <= 0) return null
  if (!Number.isFinite(lastRedirectAt) || lastRedirectAt <= 0 || lastRedirectAt > now) return null

  return { count, lastRedirectAt }
}

export type AdminLoginGuardDecision =
  | { action: 'break-loop' }
  | { action: 'redirect'; cookieValue: string }

export function decideAdminLoginRedirect(
  guardCookieValue: string | undefined | null,
  now: number,
): AdminLoginGuardDecision {
  const state = parseAdminLoginGuardCookie(guardCookieValue, now)
  const isBounce = state !== null && now - state.lastRedirectAt <= ADMIN_LOGIN_GUARD_BOUNCE_GAP_MS
  const count = isBounce ? state.count : 0

  if (count >= ADMIN_LOGIN_GUARD_MAX_REDIRECTS) {
    return { action: 'break-loop' }
  }
  return { action: 'redirect', cookieValue: `${count + 1}:${now}` }
}

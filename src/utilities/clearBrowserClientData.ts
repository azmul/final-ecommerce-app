/** Dispatched after logout clears persisted browser state (for in-memory provider resets). */
export const CLIENT_DATA_CLEARED_EVENT = 'app:client-data-cleared'

function clearAccessibleCookies(): void {
  const cookieHeader = document.cookie
  if (!cookieHeader) return

  const hostname = window.location.hostname

  for (const part of cookieHeader.split(';')) {
    const eqPos = part.indexOf('=')
    const name = (eqPos > -1 ? part.slice(0, eqPos) : part).trim()
    if (!name) continue

    const expired = 'max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = `${name}=; path=/; ${expired}`
    document.cookie = `${name}=; path=/; ${expired}; domain=${hostname}`

    if (hostname.includes('.')) {
      document.cookie = `${name}=; path=/; ${expired}; domain=.${hostname.split('.').slice(-2).join('.')}`
    }
  }
}

/** Wipes persisted client storage on logout (cart, wishlist, chat, analytics, theme, etc.). */
export function clearBrowserClientData(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.clear()
  } catch {
    // Storage may be blocked in private mode.
  }

  try {
    sessionStorage.clear()
  } catch {
    //
  }

  try {
    clearAccessibleCookies()
  } catch {
    //
  }

  window.dispatchEvent(new Event(CLIENT_DATA_CLEARED_EVENT))
}

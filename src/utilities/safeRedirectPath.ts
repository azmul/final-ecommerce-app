function stripTrailingSlash(origin: string): string {
  return origin.replace(/\/$/, '')
}

function sameOriginPath(raw: string, originBase: string): string | null {
  try {
    const u = new URL(raw)
    const base = new URL(stripTrailingSlash(originBase) || 'http://localhost')
    if (u.origin !== base.origin) return null
    return `${u.pathname}${u.search}${u.hash}`
  } catch {
    return null
  }
}

/**
 * Returns a path safe for client-side navigation after auth or form confirmation,
 * or null if the value must be ignored (open redirect).
 *
 * @param sameOriginBase — When set (e.g. `getClientSideURL()`), absolute URLs on this origin are normalized to a path.
 */
export function getSafeRedirectPath(
  raw: string | null | undefined,
  sameOriginBase?: string,
): string | null {
  if (raw == null) return null

  const decoded = (() => {
    try {
      return decodeURIComponent(raw.trim())
    } catch {
      return null
    }
  })()

  if (!decoded) return null

  if (sameOriginBase) {
    const abs = sameOriginPath(decoded, sameOriginBase)
    if (abs) {
      return validateRelativePath(abs)
    }
  }

  return validateRelativePath(decoded)
}

function validateRelativePath(decoded: string): string | null {
  if (
    /^\s*(?:https?:)?\/\//i.test(decoded) ||
    decoded.includes('\\') ||
    decoded.includes('\0') ||
    /[\u0001-\u001F\u007F]/.test(decoded)
  ) {
    return null
  }

  if (!decoded.startsWith('/')) return null
  if (decoded.startsWith('//')) return null

  return decoded
}

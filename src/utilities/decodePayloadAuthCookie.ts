type PayloadJwtPayload = {
  id?: number
  roles?: string[]
}

/** Decode the Payload auth JWT from a cookie value (Edge-safe, no signature verify). */
export function decodePayloadAuthJwt(token: string | undefined | null): PayloadJwtPayload | null {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded)) as PayloadJwtPayload
  } catch {
    return null
  }
}

export function canAccessAdminFromJwtPayload(payload: PayloadJwtPayload | null): boolean {
  if (!payload || typeof payload.id !== 'number') return false

  const roles = payload.roles
  if (!Array.isArray(roles)) return false

  return roles.includes('admin') || roles.includes('officeStaff')
}

export const PAYLOAD_AUTH_COOKIE_NAME = 'payload-token'

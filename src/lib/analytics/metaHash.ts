import { createHash } from 'crypto'

/** Meta CAPI: lowercase + trim before SHA-256 (hex). */
export function metaHashEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  return createHash('sha256').update(normalized).digest('hex')
}

/** Meta CAPI: digits only, E.164-style input preferred. */
export function metaHashPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return createHash('sha256').update(digits).digest('hex')
}

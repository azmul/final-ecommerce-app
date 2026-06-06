import { validateGuestPhone } from '@/lib/phone/guestPhoneCountries'

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizePhoneDigits(contact: string): string | null {
  const digits = contact.replace(/\D/g, '')
  if (!digits) return null

  const bd = validateGuestPhone('BD', digits)
  if (bd.ok) return bd.normalized

  const india = validateGuestPhone('IN', digits)
  if (india.ok) return india.normalized

  return null
}

/** Accepts a real email or a phone number; returns the value Payload stores as `email` for auth. */
export function contactToLoginEmail(contact: string): string {
  const trimmed = contact.trim()
  if (isEmailLike(trimmed)) return trimmed.toLowerCase()

  const normalized = normalizePhoneDigits(trimmed)
  const digits = normalized ?? trimmed.replace(/\D/g, '')
  return `phone.${digits}@example.com`
}

/** Email values to try when signing in with a phone or email contact. */
export function resolveLoginEmails(contact: string): string[] {
  const trimmed = contact.trim()
  if (isEmailLike(trimmed)) return [trimmed.toLowerCase()]

  const primary = contactToLoginEmail(trimmed)
  const rawDigits = trimmed.replace(/\D/g, '')
  const legacy = `phone.${rawDigits}@example.com`

  return legacy === primary ? [primary] : [primary, legacy]
}

export function loginEmailToContact(email: string): string {
  const trimmed = email.trim().toLowerCase()
  const phoneMatch = /^phone\.(\d{10,15})@example\.com$/.exec(trimmed)
  if (phoneMatch?.[1]) return phoneMatch[1]
  return email
}

export function isValidEmailOrPhone(contact: string): boolean {
  const trimmed = contact.trim()
  if (!trimmed) return false
  if (isEmailLike(trimmed)) return true
  return normalizePhoneDigits(trimmed) !== null
}

export function isPhoneContact(contact: string): boolean {
  const trimmed = contact.trim()
  if (!trimmed || isEmailLike(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return validateGuestPhone('BD', digits).ok || validateGuestPhone('IN', digits).ok
}

/**
 * Guest phone for orders/transactions when the initiate handler only forwards customerEmail
 * (synthetic phone.*@example.com) and not customerPhone.
 */
export function resolveGuestPhoneFromCheckoutContact(args: {
  customerEmail?: string
  customerPhone?: string
}): string | undefined {
  const direct = args.customerPhone?.trim()
  if (direct) return direct

  const email = args.customerEmail?.trim().toLowerCase()
  if (!email) return undefined

  const fromLogin = loginEmailToContact(email)
  if (fromLogin.toLowerCase() !== email) {
    return fromLogin
  }

  return undefined
}

/** Email sent to payment APIs — works for logged-in, guest, and phone-only accounts. */
export function resolveCheckoutCustomerEmail(args: {
  user?: { email?: string | null; phone?: string | null } | null
  guestPhone?: string
}): string | undefined {
  const userEmail = typeof args.user?.email === 'string' ? args.user.email.trim() : ''
  if (userEmail) return userEmail.toLowerCase()

  const phone = args.guestPhone?.trim() || args.user?.phone?.trim() || ''
  if (phone) return contactToLoginEmail(phone)

  return undefined
}

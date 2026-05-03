function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Accepts a real email or a phone number; returns the value Payload stores as `email` for auth. */
export function contactToLoginEmail(contact: string): string {
  const trimmed = contact.trim()
  if (isEmailLike(trimmed)) return trimmed.toLowerCase()
  const digits = trimmed.replace(/\D/g, '')
  return `phone.${digits}@example.com`
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
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export function isPhoneContact(contact: string): boolean {
  const trimmed = contact.trim()
  if (!trimmed || isEmailLike(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

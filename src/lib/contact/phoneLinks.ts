export function normalizeWhatsAppDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('880')) return digits
  if (digits.startsWith('01')) return `88${digits}`
  return digits
}

export function buildTelHref(phone: string | undefined): string | null {
  if (!phone?.trim()) return null
  return `tel:${phone.replace(/\s/g, '')}`
}

export function buildWhatsAppHref(
  phone: string | undefined,
  message?: string,
): string | null {
  if (!phone?.trim()) return null

  const normalized = normalizeWhatsAppDigits(phone)
  if (!normalized) return null

  const base = `https://wa.me/${normalized}`
  if (!message?.trim()) return base

  return `${base}?text=${encodeURIComponent(message)}`
}

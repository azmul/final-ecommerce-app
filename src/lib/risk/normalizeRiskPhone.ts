import { resolveLoginEmails } from '@/utilities/contactToLoginEmail'

export function normalizeRiskPhone(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 ? digits : null
}

export function phoneSearchVariants(value: string | null | undefined): string[] {
  if (!value?.trim()) return []

  const normalized = normalizeRiskPhone(value)
  const variants = new Set<string>()

  if (normalized) {
    variants.add(normalized)
  }

  for (const email of resolveLoginEmails(value)) {
    const match = /^phone\.(\d{10,15})@example\.com$/.exec(email)
    if (match?.[1]) {
      variants.add(match[1])
    }
  }

  return [...variants]
}

export function normalizeAddressKey(district: string | null | undefined, fullAddress: string | null | undefined): string | null {
  const districtPart = district?.trim().toLowerCase()
  const addressPart = fullAddress?.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!districtPart || !addressPart) return null
  return `${districtPart}|${addressPart}`
}

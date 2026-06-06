export type GuestPhoneCountry = 'BD' | 'IN'

export type GuestPhoneCountryConfig = {
  code: GuestPhoneCountry
  dialCode: string
  label: string
  localPlaceholder: string
  localPattern: RegExp
}

export const GUEST_PHONE_COUNTRIES: Record<GuestPhoneCountry, GuestPhoneCountryConfig> = {
  BD: {
    code: 'BD',
    dialCode: '+880',
    label: 'Bangladesh',
    localPlaceholder: '1712345678',
    localPattern: /^01[3-9]\d{8}$/,
  },
  IN: {
    code: 'IN',
    dialCode: '+91',
    label: 'India',
    localPlaceholder: '9876543210',
    localPattern: /^[6-9]\d{9}$/,
  },
}

export const GUEST_PHONE_COUNTRY_OPTIONS = Object.values(GUEST_PHONE_COUNTRIES)

export type GuestPhoneValidationResult =
  | { ok: true; normalized: string; national: string }
  | { ok: false; message: string }

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeBangladeshPhone(digits: string): GuestPhoneValidationResult {
  let national = digits

  if (national.startsWith('880')) {
    national = national.slice(3)
  }

  if (national.length === 10 && national.startsWith('1')) {
    national = `0${national}`
  }

  if (!GUEST_PHONE_COUNTRIES.BD.localPattern.test(national)) {
    return {
      ok: false,
      message: 'Enter a valid Bangladesh mobile number (01XXXXXXXXX).',
    }
  }

  return {
    ok: true,
    national,
    normalized: `880${national.slice(1)}`,
  }
}

function normalizeIndiaPhone(digits: string): GuestPhoneValidationResult {
  let national = digits

  if (national.startsWith('91')) {
    national = national.slice(2)
  }

  if (national.startsWith('0') && national.length === 11) {
    national = national.slice(1)
  }

  if (!GUEST_PHONE_COUNTRIES.IN.localPattern.test(national)) {
    return {
      ok: false,
      message: 'Enter a valid India mobile number (10 digits starting with 6–9).',
    }
  }

  return {
    ok: true,
    national,
    normalized: `91${national}`,
  }
}

export function validateGuestPhone(
  country: GuestPhoneCountry,
  input: string,
): GuestPhoneValidationResult {
  const digits = digitsOnly(input.trim())
  if (!digits) {
    return { ok: false, message: 'Phone number is required.' }
  }

  if (country === 'BD') {
    return normalizeBangladeshPhone(digits)
  }

  return normalizeIndiaPhone(digits)
}

export function formatGuestPhoneDisplay(
  country: GuestPhoneCountry,
  normalizedDigits: string,
): string {
  const digits = digitsOnly(normalizedDigits)
  const config = GUEST_PHONE_COUNTRIES[country]

  if (country === 'BD' && digits.startsWith('880') && digits.length === 13) {
    const national = digits.slice(3)
    return `${config.dialCode} ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
  }

  if (country === 'IN' && digits.startsWith('91') && digits.length === 12) {
    const national = digits.slice(2)
    return `${config.dialCode} ${national.slice(0, 5)} ${national.slice(5)}`
  }

  return `${config.dialCode} ${digits}`
}

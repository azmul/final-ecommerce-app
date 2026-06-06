import { describe, expect, it } from 'vitest'

import {
  formatGuestPhoneDisplay,
  validateGuestPhone,
} from '@/lib/phone/guestPhoneCountries'

describe('validateGuestPhone', () => {
  it('accepts Bangladesh local mobile numbers', () => {
    expect(validateGuestPhone('BD', '01712345678')).toEqual({
      ok: true,
      national: '01712345678',
      normalized: '8801712345678',
    })
  })

  it('accepts Bangladesh numbers with country code', () => {
    expect(validateGuestPhone('BD', '+880 1712 345 678')).toEqual({
      ok: true,
      national: '01712345678',
      normalized: '8801712345678',
    })
  })

  it('rejects invalid Bangladesh numbers', () => {
    expect(validateGuestPhone('BD', '02112345678').ok).toBe(false)
  })

  it('accepts India mobile numbers', () => {
    expect(validateGuestPhone('IN', '9876543210')).toEqual({
      ok: true,
      national: '9876543210',
      normalized: '919876543210',
    })
  })

  it('accepts India numbers with country code', () => {
    expect(validateGuestPhone('IN', '+91 98765 43210')).toEqual({
      ok: true,
      national: '9876543210',
      normalized: '919876543210',
    })
  })

  it('rejects invalid India numbers', () => {
    expect(validateGuestPhone('IN', '5876543210').ok).toBe(false)
  })
})

describe('formatGuestPhoneDisplay', () => {
  it('formats Bangladesh numbers', () => {
    expect(formatGuestPhoneDisplay('BD', '8801712345678')).toBe('+880 171 234 5678')
  })

  it('formats India numbers', () => {
    expect(formatGuestPhoneDisplay('IN', '919876543210')).toBe('+91 98765 43210')
  })
})

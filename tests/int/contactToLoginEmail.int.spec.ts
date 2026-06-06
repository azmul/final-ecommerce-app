import { describe, expect, it } from 'vitest'

import {
  contactToLoginEmail,
  isValidEmailOrPhone,
  resolveCheckoutCustomerEmail,
  resolveGuestPhoneFromCheckoutContact,
  resolveLoginEmails,
} from '@/utilities/contactToLoginEmail'

describe('resolveCheckoutCustomerEmail', () => {
  it('uses account email when logged in', () => {
    expect(
      resolveCheckoutCustomerEmail({
        user: { email: 'Buyer@Example.com', phone: '01711111111' },
      }),
    ).toBe('buyer@example.com')
  })

  it('derives email from account phone when email is missing', () => {
    expect(
      resolveCheckoutCustomerEmail({
        user: { email: null, phone: '01711111111' },
      }),
    ).toBe(contactToLoginEmail('01711111111'))
  })

  it('uses guest phone for guest checkout', () => {
    expect(
      resolveCheckoutCustomerEmail({
        guestPhone: '01722222222',
        user: null,
      }),
    ).toBe(contactToLoginEmail('01722222222'))
  })

  it('returns undefined when no contact is available', () => {
    expect(resolveCheckoutCustomerEmail({ user: null })).toBeUndefined()
  })
})

describe('resolveGuestPhoneFromCheckoutContact', () => {
  it('prefers explicit guest phone', () => {
    expect(
      resolveGuestPhoneFromCheckoutContact({
        customerEmail: contactToLoginEmail('01733333333'),
        customerPhone: '01711111111',
      }),
    ).toBe('01711111111')
  })

  it('derives phone from synthetic login email when phone field is missing', () => {
    expect(
      resolveGuestPhoneFromCheckoutContact({
        customerEmail: contactToLoginEmail('01722222222'),
      }),
    ).toBe('8801722222222')
  })

  it('returns undefined for real email contacts', () => {
    expect(
      resolveGuestPhoneFromCheckoutContact({
        customerEmail: 'buyer@example.com',
      }),
    ).toBeUndefined()
  })
})

describe('contactToLoginEmail', () => {
  it('normalizes Bangladesh local numbers to international digits', () => {
    expect(contactToLoginEmail('01712345678')).toBe('phone.8801712345678@example.com')
  })

  it('normalizes Bangladesh numbers with country code', () => {
    expect(contactToLoginEmail('+880 1712 345 678')).toBe('phone.8801712345678@example.com')
  })

  it('normalizes India mobile numbers', () => {
    expect(contactToLoginEmail('9876543210')).toBe('phone.919876543210@example.com')
  })

  it('leaves real emails unchanged', () => {
    expect(contactToLoginEmail('Buyer@Example.com')).toBe('buyer@example.com')
  })
})

describe('resolveLoginEmails', () => {
  it('returns a single email for real addresses', () => {
    expect(resolveLoginEmails('buyer@example.com')).toEqual(['buyer@example.com'])
  })

  it('includes legacy raw-digit email when normalization changes the value', () => {
    expect(resolveLoginEmails('01712345678')).toEqual([
      'phone.8801712345678@example.com',
      'phone.01712345678@example.com',
    ])
  })
})

describe('isValidEmailOrPhone', () => {
  it('accepts supported phone formats', () => {
    expect(isValidEmailOrPhone('01712345678')).toBe(true)
    expect(isValidEmailOrPhone('+91 98765 43210')).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    expect(isValidEmailOrPhone('02112345678')).toBe(false)
    expect(isValidEmailOrPhone('123')).toBe(false)
  })
})

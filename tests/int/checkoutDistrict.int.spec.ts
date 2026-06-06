import { describe, expect, it } from 'vitest'

import {
  findAddressWithDistrict,
  resolveCheckoutDistrict,
} from '@/lib/addresses/checkoutDistrict'

describe('resolveCheckoutDistrict', () => {
  it('uses billing address when shipping matches billing', () => {
    expect(
      resolveCheckoutDistrict({
        billingAddress: { district: 'Dhaka', fullAddress: 'Street 1' },
        billingAddressSameAsShipping: true,
        shippingAddress: undefined,
      }),
    ).toBe('Dhaka')
  })

  it('uses shipping address when billing and shipping differ', () => {
    expect(
      resolveCheckoutDistrict({
        billingAddress: { district: 'Dhaka', fullAddress: 'Billing' },
        billingAddressSameAsShipping: false,
        shippingAddress: { district: 'Chattogram', fullAddress: 'Shipping' },
      }),
    ).toBe('Chattogram')
  })

  it('falls back to billing when separate shipping is not selected yet', () => {
    expect(
      resolveCheckoutDistrict({
        billingAddress: { district: 'Dhaka', fullAddress: 'Billing' },
        billingAddressSameAsShipping: false,
        shippingAddress: undefined,
      }),
    ).toBe('Dhaka')
  })
})

describe('findAddressWithDistrict', () => {
  it('returns the first saved address that includes a district', () => {
    expect(
      findAddressWithDistrict([
        { district: '', fullAddress: 'No district' },
        { district: 'Dhaka', fullAddress: 'Street 1' },
      ])?.district,
    ).toBe('Dhaka')
  })
})

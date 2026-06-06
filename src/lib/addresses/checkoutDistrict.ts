import type { Address } from '@/payload-types'

export function resolveAddressDistrict(address?: Partial<Address> | null): string {
  if (!address || typeof address.district !== 'string') {
    return ''
  }

  return address.district.trim()
}

export function resolveCheckoutDistrict(args: {
  billingAddress?: Partial<Address> | null
  billingAddressSameAsShipping: boolean
  shippingAddress?: Partial<Address> | null
}): string {
  const destination =
    args.billingAddressSameAsShipping ?
      args.billingAddress
    : (args.shippingAddress ?? args.billingAddress)

  return resolveAddressDistrict(destination)
}

export function findAddressWithDistrict(addresses?: Partial<Address>[] | null): Partial<Address> | undefined {
  return addresses?.find((address) => resolveAddressDistrict(address).length > 0)
}

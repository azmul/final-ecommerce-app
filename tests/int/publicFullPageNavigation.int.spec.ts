import { describe, expect, it } from 'vitest'

import {
  isPublicFullReloadRoute,
  shouldForceFullPageNavigation,
} from '@/utilities/publicFullPageNavigation'

const currentHref = 'https://example.com/products/headphones'

describe('public full page navigation routing', () => {
  it.each([
    '/',
    '/products/headphones',
    '/shop',
    '/shop/audio',
    '/blog/how-to-buy',
    '/brand/acme',
    '/all-brands',
    '/spring-campaign',
  ])('treats %s as public reloadable content', (pathname) => {
    expect(isPublicFullReloadRoute(pathname)).toBe(true)
  })

  it.each([
    '/checkout',
    '/checkout/confirm-order',
    '/cart',
    '/account',
    '/orders/123',
    '/login',
    '/api/product-search',
    '/admin',
    '/_next/static/chunk.js',
    '/favicon.ico',
  ])('excludes %s from public reload behavior', (pathname) => {
    expect(isPublicFullReloadRoute(pathname)).toBe(false)
  })

  it('forces document navigation between public pages', () => {
    expect(
      shouldForceFullPageNavigation({
        currentHref,
        href: 'https://example.com/blog/how-to-buy',
      }),
    ).toBe(true)
  })

  it('keeps checkout navigation in the client-side flow', () => {
    expect(
      shouldForceFullPageNavigation({
        currentHref,
        href: 'https://example.com/checkout',
      }),
    ).toBe(false)

    expect(
      shouldForceFullPageNavigation({
        currentHref: 'https://example.com/checkout',
        href: 'https://example.com/checkout/confirm-order',
      }),
    ).toBe(false)
  })

  it('does not force reloads for external or same-document hash links', () => {
    expect(
      shouldForceFullPageNavigation({
        currentHref,
        href: 'https://search.example.com/products/headphones',
      }),
    ).toBe(false)

    expect(
      shouldForceFullPageNavigation({
        currentHref,
        href: 'https://example.com/products/headphones#reviews',
      }),
    ).toBe(false)
  })
})

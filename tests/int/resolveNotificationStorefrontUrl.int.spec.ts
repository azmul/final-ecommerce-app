import { describe, expect, it } from 'vitest'

import { enrichNotificationsWithStorefrontUrls } from '@/lib/notifications/resolveNotificationStorefrontUrl'
import { productStorefrontPath } from '@/lib/notifications/productStorefrontPath'

describe('resolveNotificationStorefrontUrl', () => {
  it('maps admin product links to storefront paths', async () => {
    const payload = {
      find: async () => ({
        docs: [{ id: 42, slug: 'cool-shirt' }],
      }),
    } as never

    const [row] = await enrichNotificationsWithStorefrontUrls(payload, [
      {
        id: 1,
        kind: 'price_drop',
        linkUrl: '/admin/collections/products/42',
        product: 42,
      },
    ])

    expect(row.linkUrl).toBe('/products/cool-shirt')
  })

  it('builds storefront path from product relation when link is missing', async () => {
    const payload = {
      find: async () => ({
        docs: [{ id: 7, slug: 'blue-bag' }],
      }),
    } as never

    const [row] = await enrichNotificationsWithStorefrontUrls(payload, [
      {
        id: 2,
        kind: 'restock',
        linkUrl: null,
        product: 7,
      },
    ])

    expect(row.linkUrl).toBe('/products/blue-bag')
  })
})

describe('productStorefrontPath', () => {
  it('prefers slug over absolute url', () => {
    expect(
      productStorefrontPath({
        id: 1,
        slug: 'widget',
        url: 'http://localhost:3000/admin/collections/products/1',
      }),
    ).toBe('/products/widget')
  })
})

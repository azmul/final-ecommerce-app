import { describe, expect, it } from 'vitest'

import { buildMetaCapiPayload } from '@/lib/analytics/meta/capi'
import { buildMetaCapiUserData } from '@/lib/analytics/meta/userData'
import {
  createPurchaseEventId,
  createStoreEventId,
} from '@/lib/analytics/meta/eventId'
import { metaHashEmail, metaHashPhone } from '@/lib/analytics/metaHash'
import {
  productContentId,
  resolveProductCategory,
  toMetaCustomDataFromProduct,
} from '@/lib/analytics/meta/productContent'
import { STORE_EVENT_TO_META } from '@/lib/analytics/meta/types'

describe('metaHashEmail', () => {
  it('normalizes and hashes email', () => {
    const a = metaHashEmail('  Test@Example.COM ')
    const b = metaHashEmail('test@example.com')
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('metaHashPhone', () => {
  it('strips non-digits before hashing', () => {
    const a = metaHashPhone('+880 1711-111111')
    const b = metaHashPhone('8801711111111')
    expect(a).toBe(b)
    expect(a.length).toBeGreaterThan(0)
  })
})

describe('buildMetaCapiUserData', () => {
  it('includes hashed PII and external id', () => {
    const data = buildMetaCapiUserData({
      email: 'buyer@example.com',
      phone: '01711111111',
      clientIp: '127.0.0.1',
      clientUserAgent: 'vitest',
      externalId: 'user-42',
      fbp: 'fb.1.123',
      fbc: 'fb.1.456',
    })

    expect(data.em).toEqual([metaHashEmail('buyer@example.com')])
    expect(data.ph).toEqual([metaHashPhone('01711111111')])
    expect(data.client_ip_address).toBe('127.0.0.1')
    expect(data.client_user_agent).toBe('vitest')
    expect(data.external_id).toBe('user-42')
    expect(data.fbp).toBe('fb.1.123')
    expect(data.fbc).toBe('fb.1.456')
  })
})

describe('buildMetaCapiPayload', () => {
  it('builds deduplicated event payload with test code', () => {
    const payload = buildMetaCapiPayload(
      [
        {
          eventId: 'evt_123',
          eventName: 'ViewContent',
          customData: {
            content_ids: ['hat'],
            currency: 'BDT',
            value: 999,
          },
          userData: { externalId: 'sess-1' },
        },
      ],
      'TESTCODE',
    )

    expect(payload.test_event_code).toBe('TESTCODE')
    const row = (payload.data as Record<string, unknown>[])[0]
    expect(row.event_id).toBe('evt_123')
    expect(row.event_name).toBe('ViewContent')
    expect(row.action_source).toBe('website')
  })
})

describe('event ids', () => {
  it('creates stable purchase ids', () => {
    expect(createPurchaseEventId(99)).toBe('purchase_99')
  })

  it('creates typed store event ids', () => {
    expect(createStoreEventId('search', 'shoes')).toMatch(/^search_shoes_/)
  })
})

describe('product content helpers', () => {
  it('prefers slug as content id', () => {
    expect(productContentId({ id: 5, slug: 'blue-hat' })).toBe('blue-hat')
    expect(productContentId({ id: 5 })).toBe('5')
  })

  it('maps product to ViewContent custom data', () => {
    const data = toMetaCustomDataFromProduct({
      category: 'Hats',
      currency: 'BDT',
      id: 1,
      price: 500,
      slug: 'hat',
      title: 'Blue Hat',
    })

    expect(data.content_ids).toEqual(['hat'])
    expect(data.content_name).toBe('Blue Hat')
    expect(data.value).toBe(500)
    expect(data.currency).toBe('BDT')
  })

  it('resolves first category title', () => {
    expect(resolveProductCategory([{ title: 'Apparel' }])).toBe('Apparel')
    expect(resolveProductCategory([])).toBeUndefined()
  })
})

describe('STORE_EVENT_TO_META', () => {
  it('maps full ecommerce funnel', () => {
    expect(STORE_EVENT_TO_META.product_view).toBe('ViewContent')
    expect(STORE_EVENT_TO_META.add_to_cart).toBe('AddToCart')
    expect(STORE_EVENT_TO_META.begin_checkout).toBe('InitiateCheckout')
    expect(STORE_EVENT_TO_META.add_payment_info).toBe('AddPaymentInfo')
    expect(STORE_EVENT_TO_META.purchase).toBe('Purchase')
  })
})

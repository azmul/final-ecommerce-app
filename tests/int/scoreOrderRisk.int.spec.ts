import { describe, expect, it, vi } from 'vitest'

import { isRiskAssessmentUpdate, markRiskAssessmentContext } from '@/lib/risk/applyRiskAssessment'
import { scoreOrderRisk } from '@/lib/risk/scoreOrderRisk'
import { scoreUserRisk } from '@/lib/risk/scoreUserRisk'
import type { Order, User } from '@/payload-types'
import type { Payload } from 'payload'

function createPayloadMock(): Payload {
  return {
    find: vi.fn().mockResolvedValue({ docs: [], hasNextPage: false }),
    findByID: vi.fn().mockRejectedValue(new Error('not found')),
  } as unknown as Payload
}

describe('scoreOrderRisk', () => {
  it('flags guest COD checkout, high amount, weak address, and promo on first guest order', async () => {
    const payload = createPayloadMock()
    const order = {
      id: 999001,
      amount: 600_000,
      appliedPromoCode: 'WELCOME10',
      createdAt: new Date().toISOString(),
      currency: 'BDT',
      customer: null,
      customerPhone: '8801712345678',
      shippingAddress: {
        district: 'Dhaka',
        fullAddress: 'test',
      },
      status: 'processing',
      transactions: [],
      updatedAt: new Date().toISOString(),
    } as Order

    const result = await scoreOrderRisk({
      payload,
      order,
      requestContext: { ip: '203.0.113.10', userAgent: 'vitest' },
    })

    expect(result.level).not.toBe('low')
    expect(result.flags.some((entry) => entry.flag === 'guest_cod_checkout')).toBe(true)
    expect(result.flags.some((entry) => entry.flag === 'high_cod_amount')).toBe(true)
    expect(result.flags.some((entry) => entry.flag === 'weak_address')).toBe(true)
    expect(result.flags.some((entry) => entry.flag === 'promo_first_guest_order')).toBe(true)
  })
})

describe('scoreUserRisk', () => {
  it('flags disposable email and suspicious names', async () => {
    const payload = createPayloadMock()
    const user = {
      id: 999002,
      createdAt: new Date().toISOString(),
      email: 'test@mailinator.com',
      name: 'test',
      phone: '8801712345678',
      referralCode: 'TESTCODE',
      roles: ['customer'],
      updatedAt: new Date().toISOString(),
    } as User

    const result = await scoreUserRisk({
      payload,
      user,
      requestContext: { ip: null, userAgent: 'vitest' },
    })

    expect(result.flags.some((entry) => entry.flag === 'disposable_email')).toBe(true)
    expect(result.flags.some((entry) => entry.flag === 'suspicious_name')).toBe(true)
  })
})

describe('risk assessment hook guards', () => {
  it('marks risk assessment context to prevent hook loops', () => {
    const req = { context: {} as Record<string, unknown> }
    expect(isRiskAssessmentUpdate(req)).toBe(false)
    markRiskAssessmentContext(req)
    expect(isRiskAssessmentUpdate(req)).toBe(true)
  })
})

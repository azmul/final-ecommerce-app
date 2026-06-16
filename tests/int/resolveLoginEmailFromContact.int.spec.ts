import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { resolveLoginEmailFromContact } from '@/lib/auth/resolveLoginEmailFromContact'
import { contactToLoginEmail } from '@/utilities/contactToLoginEmail'

const TEST_EMAIL = 'login-phone-test@example.com'
const TEST_PHONE = '8801712345999'
const TEST_PASSWORD = 'Password1'

let payload: Payload

describe('resolveLoginEmailFromContact', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    await payload.delete({
      collection: 'users',
      overrideAccess: true,
      where: {
        email: {
          equals: TEST_EMAIL,
        },
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: TEST_EMAIL,
        name: 'Phone Login Test',
        password: TEST_PASSWORD,
        phone: TEST_PHONE,
        roles: ['customer'],
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    if (!payload) return

    await payload.delete({
      collection: 'users',
      overrideAccess: true,
      where: {
        email: {
          equals: TEST_EMAIL,
        },
      },
    })
  })

  it('returns real email when logging in with stored phone number', async () => {
    await expect(resolveLoginEmailFromContact(payload, '01712345999')).resolves.toBe(TEST_EMAIL)
    await expect(resolveLoginEmailFromContact(payload, '+880 1712 345 999')).resolves.toBe(
      TEST_EMAIL,
    )
  })

  it('returns email unchanged for email contacts', async () => {
    await expect(resolveLoginEmailFromContact(payload, 'Buyer@Example.com')).resolves.toBe(
      'buyer@example.com',
    )
  })

  it('resolves synthetic login email for phone-only accounts', async () => {
    const phoneOnlyEmail = contactToLoginEmail('01712345888')

    await payload.delete({
      collection: 'users',
      overrideAccess: true,
      where: {
        email: {
          equals: phoneOnlyEmail,
        },
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: phoneOnlyEmail,
        name: 'Phone Only',
        password: TEST_PASSWORD,
        phone: '8801712345888',
        roles: ['customer'],
      },
      overrideAccess: true,
    })

    await expect(resolveLoginEmailFromContact(payload, '01712345888')).resolves.toBe(phoneOnlyEmail)

    await payload.delete({
      collection: 'users',
      overrideAccess: true,
      where: {
        email: {
          equals: phoneOnlyEmail,
        },
      },
    })
  })
})

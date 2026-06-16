import type { Payload } from 'payload'

import config from '@/payload.config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

const sampleFooterData = {
  description: 'Test footer description for integration coverage.',
  address: 'Rampura, Dhaka, Bangladesh',
  phone: '09642922922',
  email: 'contact@example.com',
  copyrightText: '© Test Store. All rights reserved.',
  socialLinks: {
    facebook: 'https://facebook.com/example',
    twitter: 'https://twitter.com/example',
    instagram: 'https://instagram.com/example',
  },
  appLinks: {
    googlePlay: 'https://play.google.com/store/apps/details?id=example',
    appStore: 'https://apps.apple.com/app/example',
  },
  linkColumns: [
    {
      title: 'Information',
      items: [
        {
          link: {
            type: 'custom' as const,
            label: 'About us',
            url: '/about',
          },
        },
        {
          link: {
            type: 'custom' as const,
            label: 'FAQ',
            url: '/faq',
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          link: {
            type: 'custom' as const,
            label: 'Contact us',
            url: '/contact',
            newTab: true,
          },
        },
      ],
    },
  ],
}

describe('footer global', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    await payload.updateGlobal({
      slug: 'footer',
      data: sampleFooterData,
      context: { disableRevalidate: true },
    })
  })

  it('reads footer global from database', async () => {
    const footer = await payload.findGlobal({ slug: 'footer', depth: 0 })
    expect(footer).toBeDefined()
    expect(footer).toHaveProperty('socialLinks')
    expect(footer).toHaveProperty('linkColumns')
  })

  it('persists brand, contact, social, app, and link column fields', async () => {
    const updated = await payload.updateGlobal({
      slug: 'footer',
      data: sampleFooterData,
      depth: 1,
      context: { disableRevalidate: true },
    })

    expect(updated.description).toBe(sampleFooterData.description)
    expect(updated.address).toBe(sampleFooterData.address)
    expect(updated.phone).toBe(sampleFooterData.phone)
    expect(updated.email).toBe(sampleFooterData.email)
    expect(updated.copyrightText).toBe(sampleFooterData.copyrightText)
    expect(updated.socialLinks?.facebook).toBe(sampleFooterData.socialLinks.facebook)
    expect(updated.appLinks?.googlePlay).toBe(sampleFooterData.appLinks.googlePlay)
    expect(updated.linkColumns).toHaveLength(2)
    expect(updated.linkColumns?.[0]?.title).toBe('Information')
    expect(updated.linkColumns?.[0]?.items).toHaveLength(2)
    expect(updated.linkColumns?.[0]?.items?.[0]?.link.label).toBe('About us')
    expect(updated.linkColumns?.[1]?.items?.[0]?.link.newTab).toBe(true)

    const reloaded = await payload.findGlobal({ slug: 'footer', depth: 0 })
    expect(reloaded.description).toBe(sampleFooterData.description)
    expect(reloaded.linkColumns).toHaveLength(2)
  })

  it('allows public read access', async () => {
    const footer = await payload.findGlobal({
      slug: 'footer',
      depth: 0,
      overrideAccess: false,
    })
    expect(footer).toBeDefined()
  })
})

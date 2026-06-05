import { ImageResponse } from 'next/og'

import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

/**
 * Site-wide default Open Graph / Twitter card image.
 *
 * Next.js applies this to every storefront route that does not declare its own
 * `openGraph.images` (home, CMS pages, shop, blog index, brand, all-brands…),
 * giving social shares and AI answer engines a branded preview instead of a
 * blank card. Pages that set explicit images (e.g. products) override it.
 */
export const alt = getSiteSeoConfig().name
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  const site = getSiteSeoConfig()
  const host = site.url.replace(/^https?:\/\//, '')

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #0b1220 0%, #111827 55%, #1f2937 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          padding: '80px',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            color: '#a5b4fc',
            display: 'flex',
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {site.name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              maxWidth: '960px',
            }}
          >
            {site.description}
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            color: '#cbd5e1',
            display: 'flex',
            fontSize: 30,
            fontWeight: 500,
            gap: '16px',
          }}
        >
          <div
            style={{
              background: '#6366f1',
              borderRadius: '9999px',
              height: '16px',
              width: '16px',
            }}
          />
          {host}
        </div>
      </div>
    ),
    { ...size },
  )
}

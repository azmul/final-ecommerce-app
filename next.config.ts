import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import { redirects } from './redirects'
import { getServerActionAllowedOrigins } from './src/utilities/payloadOriginPolicy'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

function r2ImageRemotePatterns(): Array<{
  hostname: string
  pathname: string
  protocol: 'http' | 'https'
}> {
  const patterns: Array<{
    hostname: string
    pathname: string
    protocol: 'http' | 'https'
  }> = [
    {
      hostname: '**.r2.dev',
      pathname: '/**',
      protocol: 'https',
    },
  ]

  const publicUrl = process.env.R2_PUBLIC_URL?.trim()
  if (publicUrl) {
    try {
      const { hostname, protocol } = new URL(publicUrl)
      patterns.push({
        hostname,
        pathname: '/**',
        protocol: protocol.replace(':', '') as 'http' | 'https',
      })
    } catch {
      // ignore invalid R2_PUBLIC_URL
    }
  }

  return patterns
}

/** CSP allowances for embedded product gallery videos (react-player / platform iframes). */
const VIDEO_FRAME_SRC = [
  'https://www.youtube.com',
  'https://youtube.com',
  'https://www.youtube-nocookie.com',
  'https://*.youtube.com',
  'https://player.vimeo.com',
  'https://vimeo.com',
  'https://www.dailymotion.com',
  'https://*.dailymotion.com',
  'https://www.facebook.com',
  'https://*.facebook.com',
  'https://fast.wistia.net',
  'https://*.wistia.com',
  'https://www.twitch.tv',
  'https://player.twitch.tv',
  'https://streamable.com',
  'https://*.streamable.com',
  'https://www.tiktok.com',
  'https://*.tiktok.com',
].join(' ')

const VIDEO_SCRIPT_SRC = [
  'https://www.youtube.com',
  'https://*.youtube.com',
  'https://www.gstatic.com',
  'https://*.google.com',
  'https://player.vimeo.com',
  'https://*.vimeo.com',
  'https://*.dailymotion.com',
  'https://*.wistia.com',
  'https://*.tiktok.com',
].join(' ')

const VIDEO_CONNECT_SRC = [
  'https://www.youtube.com',
  'https://*.youtube.com',
  'https://*.googlevideo.com',
  'https://*.google.com',
  'https://vimeo.com',
  'https://*.vimeo.com',
  'https://*.dailymotion.com',
  'https://*.wistia.com',
].join(' ')

/** Allow next/image to optimize URLs that resolve to loopback (e.g. CMS media on same dev server). */
function dangerouslyAllowLocalIP(): boolean {
  try {
    const { hostname } = new URL(NEXT_PUBLIC_SERVER_URL)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost')
    )
  } catch {
    return false
  }
}

const nextConfig: NextConfig = {
  /** Dev-only: allow cross-origin access to Next dev resources. */
  allowedDevOrigins: ['213.199.54.6'],

  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  compress: true,
  experimental: {
    serverActions: {
      allowedOrigins: getServerActionAllowedOrigins(),
    },
    optimizePackageImports: [
      'lucide-react',
      '@payloadcms/plugin-ecommerce/client/react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      'date-fns',
      'embla-carousel-react',
      'embla-carousel-autoplay',
      'embla-carousel-auto-scroll',
    ],
  },
  poweredByHeader: false,
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1920],
    formats: ['image/avif', 'image/webp'],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    ...(dangerouslyAllowLocalIP() ? { dangerouslyAllowLocalIP: true } : {}),
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [75, 80, 90, 100],
    remotePatterns: [
      {
        hostname: 'raw.githubusercontent.com',
        pathname: '/payloadcms/payload/**',
        protocol: 'https',
      },
      { hostname: 'img.youtube.com', pathname: '/vi/**', protocol: 'https' },
      { hostname: 'i.ytimg.com', pathname: '/**', protocol: 'https' },
      ...r2ImageRemotePatterns(),
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
    ],
  },
  reactStrictMode: true,
  redirects,
  async rewrites() {
    const indexNowKey = process.env.INDEXNOW_KEY?.trim()

    return {
      // Next's metadata router reserves /sitemap.xml but, with
      // generateSitemaps(), only serves /sitemap/[id].xml — the bare path
      // 404s. beforeFiles wins over the metadata route, so /sitemap.xml
      // serves our sitemap index.
      beforeFiles: [
        {
          destination: '/sitemap-index.xml',
          source: '/sitemap.xml',
        },
      ],
      afterFiles: indexNowKey
        ? [
            {
              destination: '/api/indexnow/key-file',
              source: `/${indexNowKey}.txt`,
            },
          ]
        : [],
      fallback: [],
    }
  },
  async headers() {
    return [
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
        source: '/api/media/:path*',
      },
      {
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
        source: '/admin/:path*',
      },
      {
        // The service worker script must revalidate on every check, or new
        // deploys wait out the HTTP cache before users get the update.
        headers: [{ key: 'Cache-Control', value: 'no-cache, max-age=0, must-revalidate' }],
        source: '/sw.js',
      },
      {
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(self), autoplay=(self), encrypted-media=(self), fullscreen=(self), gyroscope=(self), picture-in-picture=(self), camera=(), microphone=(self), geolocation=()',
          },
          // Only advertise HSTS when the site is actually served over HTTPS.
          // Sending it on a plain-HTTP deployment (e.g. http://<ip>:3000) tells
          // browsers to force HTTPS for the host — which then fails to connect
          // (no TLS listener) or shifts the origin to https://, breaking the
          // http-only CSRF/CORS allowlist and dropping the admin auth cookie.
          ...(process.env.NODE_ENV === 'production' && NEXT_PUBLIC_SERVER_URL.startsWith('https://')
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              // React's dev build requires eval() for debugging features
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"} https://js.stripe.com https://*.facebook.net https://*.google-analytics.com https://*.googletagmanager.com ${VIDEO_SCRIPT_SRC}`,
              `frame-src 'self' https://js.stripe.com https://*.facebook.com https://*.google.com ${VIDEO_FRAME_SRC}`,
              `img-src 'self' data: blob: https: ${NEXT_PUBLIC_SERVER_URL}`,
              `connect-src 'self' https://api.stripe.com https://*.facebook.com https://*.google-analytics.com https://*.googletagmanager.com ${VIDEO_CONNECT_SRC}`,
              "media-src 'self' blob: https: data:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "manifest-src 'self'",
              "worker-src 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
        source: '/:path*',
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const config = withPayload(nextConfig)

// withPayload() adds `Critical-CH: Sec-CH-Prefers-Color-Scheme` to every route,
// which makes Chrome restart the very first navigation (a same-URL 307 costing
// one full round trip — ~600ms on mobile — before anything renders). The hint
// only drives the admin panel's theme detection, so scope that rule to /admin.
const baseHeaders = config.headers
if (baseHeaders) {
  config.headers = async () => {
    const rules = await baseHeaders()
    return rules.map((rule) =>
      rule.source === '/:path*' && rule.headers.some((h) => h.key === 'Critical-CH')
        ? { ...rule, source: '/admin/:path*' }
        : rule,
    )
  }
}

export default config

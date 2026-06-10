import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

function s3ImageRemotePatterns(): Array<{
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
      hostname: '**.amazonaws.com',
      pathname: '/**',
      protocol: 'https',
    },
  ]

  const publicUrl = process.env.S3_PUBLIC_URL?.trim()
  if (publicUrl) {
    try {
      const { hostname, protocol } = new URL(publicUrl)
      patterns.push({
        hostname,
        pathname: '/**',
        protocol: protocol.replace(':', '') as 'http' | 'https',
      })
    } catch {
      // ignore invalid S3_PUBLIC_URL
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
  ...(process.env.NODE_ENV === 'development'
    ? {
        /** Dev-only: allow cross-origin access to Next dev resources. */
        allowedDevOrigins: ['213.199.54.6'],
      }
    : {}),
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  poweredByHeader: false,
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    ...(dangerouslyAllowLocalIP() ? { dangerouslyAllowLocalIP: true } : {}),
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [90, 100],
    remotePatterns: [
      {
        hostname: 'raw.githubusercontent.com',
        pathname: '/payloadcms/payload/**',
        protocol: 'https',
      },
      { hostname: 'img.youtube.com', pathname: '/vi/**', protocol: 'https' },
      { hostname: 'i.ytimg.com', pathname: '/**', protocol: 'https' },
      ...s3ImageRemotePatterns(),
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
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(self), autoplay=(self), encrypted-media=(self), fullscreen=(self), gyroscope=(self), picture-in-picture=(self), camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.facebook.net https://*.google-analytics.com https://*.googletagmanager.com ${VIDEO_SCRIPT_SRC}`,
              `frame-src 'self' https://js.stripe.com https://*.facebook.com https://*.google.com ${VIDEO_FRAME_SRC}`,
              "img-src 'self' data: blob: https: http://localhost:*",
              `connect-src 'self' https://api.stripe.com https://*.facebook.com https://*.google-analytics.com https://*.googletagmanager.com ${VIDEO_CONNECT_SRC}`,
              "media-src 'self' blob: https: data:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "manifest-src 'self'",
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

export default withPayload(nextConfig)

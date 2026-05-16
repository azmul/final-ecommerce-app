import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

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
  /** Dev-only: allow cross-origin access to Next dev resources when opening the app via this host (e.g. VPS IP). */
  allowedDevOrigins: ['213.199.54.6'],
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
            value: 'camera=(), microphone=(), geolocation=()',
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

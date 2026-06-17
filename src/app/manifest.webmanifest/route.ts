import { buildWebManifest } from '@/lib/pwa/buildWebManifest'

export const revalidate = 86400

/** Explicit route so `/manifest.webmanifest` is not captured by `(app)/[slug]`. */
export async function GET() {
  return Response.json(await buildWebManifest(), {
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  })
}

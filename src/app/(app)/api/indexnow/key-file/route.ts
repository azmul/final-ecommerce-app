import { getIndexNowKey } from '@/lib/seo/indexNow'

export async function GET() {
  const key = getIndexNowKey()
  if (!key) {
    return new Response('Not configured', { status: 404 })
  }

  return new Response(key, {
    headers: {
      'Cache-Control': 'public, max-age=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

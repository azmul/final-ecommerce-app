import { NextResponse } from 'next/server'

import { getAiProductContent, type AiContentResponse } from '@/lib/seo/aiContent'

export const revalidate = 300

const MAX_SLUGS = 50
const MAX_SLUG_LENGTH = 200
const MAX_BODY_BYTES = 16 * 1024 // 16 KB

const BATCH_CACHE_CONTROL =
  'public, max-age=120, s-maxage=300, stale-while-revalidate=600'

export async function POST(request: Request) {
  // Defensive body-size check via Content-Length (when present).
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const length = Number(contentLength)
    if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request body too large (max 16 KB).' },
        { status: 413 },
      )
    }
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Unable to read request body.' }, { status: 400 })
  }

  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Request body too large (max 16 KB).' },
      { status: 413 },
    )
  }

  let body: unknown
  try {
    body = raw.length === 0 ? {} : JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be a JSON object.' }, { status: 400 })
  }

  const slugsValue = (body as { slugs?: unknown }).slugs
  if (!Array.isArray(slugsValue)) {
    return NextResponse.json(
      { error: 'Field "slugs" must be an array of strings.' },
      { status: 400 },
    )
  }

  if (slugsValue.length < 1 || slugsValue.length > MAX_SLUGS) {
    return NextResponse.json(
      { error: `Field "slugs" must contain between 1 and ${MAX_SLUGS} entries.` },
      { status: 400 },
    )
  }

  const slugs: string[] = []
  for (const entry of slugsValue) {
    if (typeof entry !== 'string') {
      return NextResponse.json(
        { error: 'Each slug must be a string.' },
        { status: 400 },
      )
    }
    const trimmed = entry.trim()
    if (trimmed.length === 0 || trimmed.length > MAX_SLUG_LENGTH) {
      return NextResponse.json(
        { error: `Each slug must be 1-${MAX_SLUG_LENGTH} characters.` },
        { status: 400 },
      )
    }
    slugs.push(trimmed)
  }

  // De-duplicate while preserving order.
  const uniqueSlugs = Array.from(new Set(slugs))

  const results = await Promise.all(
    uniqueSlugs.map(async (slug) => {
      try {
        const data = await getAiProductContent(slug)
        return { slug, data }
      } catch {
        return { slug, data: null }
      }
    }),
  )

  const items: AiContentResponse[] = []
  const notFound: string[] = []
  for (const { slug, data } of results) {
    if (data) items.push(data)
    else notFound.push(slug)
  }

  return NextResponse.json(
    { items, count: items.length, notFound },
    {
      headers: {
        'Cache-Control': BATCH_CACHE_CONTROL,
      },
    },
  )
}

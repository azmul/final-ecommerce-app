import {
  buildCompareProductSnapshot,
  generateProductComparison,
} from '@/lib/ai/compareProducts'
import { logAiQuery } from '@/lib/ai/queryLog'
import { getLlmConfig } from '@/lib/ai/config'
import { withAiPostHandler } from '@/lib/ai/rateLimit'
import configPromise from '@payload-config'
import type { Product } from '@/payload-types'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// TODO: desired rate-limit budget is { limit: 20, windowMs: 60_000 }.
// `withAiPostHandler` currently applies its built-in defaults (30 / 60_000); pass options once supported.
const _postHandler = async (request: Request, _ctx: any): Promise<Response> => {
  const started = Date.now()

  let body: { ids?: unknown; question?: unknown } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
    : []

  if (ids.length < 2 || ids.length > 3) {
    return NextResponse.json({ error: 'Provide 2–3 product ids.' }, { status: 400 })
  }

  const question = typeof body.question === 'string' ? body.question.trim() : undefined

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: 3,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [{ id: { in: ids } }, { _status: { equals: 'published' } }],
    },
  })

  if (result.docs.length < 2) {
    return NextResponse.json({ error: 'Not enough published products found.' }, { status: 404 })
  }

  const snapshots = (result.docs as Product[]).map(buildCompareProductSnapshot)
  const comparison = await generateProductComparison({ products: snapshots, userQuestion: question })

  await logAiQuery(payload, {
    latencyMs: Date.now() - started,
    model: getLlmConfig().model,
    queryText: question ?? `compare:${ids.join(',')}`,
    queryType: 'compare',
    resultsCount: snapshots.length,
  })

  if (!comparison) {
    return NextResponse.json({ error: 'AI comparison unavailable.' }, { status: 503 })
  }

  return NextResponse.json({ comparison, products: snapshots })
}

export const POST = withAiPostHandler(_postHandler)

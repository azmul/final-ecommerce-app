import { searchKnowledgeBaseForAi } from '@/lib/ai/rag/searchKnowledgeBase'
import { withAiPostHandler } from '@/lib/ai/rateLimit'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// TODO: desired rate-limit budget is { limit: 20, windowMs: 60_000 }.
// `withAiPostHandler` currently applies its built-in defaults (30 / 60_000); pass options once supported.
const _postHandler = async (request: Request, _ctx: any): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })

  let body: { limit?: number; query?: string } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.query?.trim()) {
    return NextResponse.json({ error: 'query is required.' }, { status: 400 })
  }
  if (body.query.length > 4000) {
    return NextResponse.json({ error: 'query is too long.' }, { status: 413 })
  }

  try {
    const result = await searchKnowledgeBaseForAi(payload, {
      limit: body.limit,
      query: body.query.trim(),
    })
    return NextResponse.json(result)
  } catch (error) {
    payload.logger.error({ err: error, msg: 'ai-knowledge-search' })
    return NextResponse.json({ error: 'Knowledge search failed.' }, { status: 500 })
  }
}

export const POST = withAiPostHandler(_postHandler)

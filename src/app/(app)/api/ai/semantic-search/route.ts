import { semanticSearchForAi } from '@/lib/ai/semanticSearch'
import type { SemanticSearchRequest } from '@/lib/ai/types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })

  let body: SemanticSearchRequest = { query: '' }
  try {
    body = (await request.json()) as SemanticSearchRequest
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
    const result = await semanticSearchForAi(payload, body)
    return NextResponse.json(result)
  } catch (error) {
    payload.logger.error({ err: error, msg: 'ai-semantic-search' })
    return NextResponse.json({ error: 'Semantic search failed.' }, { status: 500 })
  }
}

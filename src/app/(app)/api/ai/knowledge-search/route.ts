import { searchKnowledgeBaseForAi } from '@/lib/ai/rag/searchKnowledgeBase'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

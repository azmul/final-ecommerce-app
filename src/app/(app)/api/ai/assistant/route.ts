import { runShoppingAssistant } from '@/lib/ai/agent'
import type { AiShoppingToolContext } from '@/lib/ai/checkoutTools'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isAiShoppingAssistantEnabled()) {
    return NextResponse.json({ error: 'AI shopping assistant is not configured.' }, { status: 503 })
  }

  const payload = await getPayload({ config: configPromise })

  let body: {
    context?: AiShoppingToolContext
    message?: string
    history?: { role: 'user' | 'assistant' | 'system'; content: string }[]
  } = {}

  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'message is required.' }, { status: 400 })
  }

  try {
    const result = await runShoppingAssistant({
      context: body.context,
      history: body.history,
      payload,
      userMessage: body.message.trim(),
    })

    if (!result) {
      return NextResponse.json({ error: 'AI shopping assistant is not configured.' }, { status: 503 })
    }

    return NextResponse.json(result)
  } catch (error) {
    payload.logger.error({ err: error, msg: 'ai-assistant' })
    return NextResponse.json({ error: 'AI assistant request failed.' }, { status: 500 })
  }
}

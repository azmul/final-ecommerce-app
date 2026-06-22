import { runShoppingAssistant } from '@/lib/ai/agent'
import type { AiShoppingToolContext } from '@/lib/ai/checkoutTools'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import {
  MAX_MESSAGE_CHARS,
  sanitizeAssistantHistory,
} from '@/lib/ai/validateAssistantInput'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Hard cap so a stuck LLM/tool loop can't hold a serverless function open. */
const ASSISTANT_TIMEOUT_MS = 30_000

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

  const userMessage = body.message?.trim()
  if (!userMessage) {
    return NextResponse.json({ error: 'message is required.' }, { status: 400 })
  }
  if (userMessage.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: 'message is too long.' }, { status: 413 })
  }

  // Strip system turns and cap length/count so the client cannot override the
  // system prompt or amplify paid-LLM cost via an unbounded history.
  const history = sanitizeAssistantHistory(body.history)

  try {
    const result = await Promise.race([
      runShoppingAssistant({
        context: body.context,
        history,
        payload,
        userMessage,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('assistant-timeout')), ASSISTANT_TIMEOUT_MS),
      ),
    ])

    if (!result) {
      return NextResponse.json({ error: 'AI shopping assistant is not configured.' }, { status: 503 })
    }

    return NextResponse.json(result)
  } catch (error) {
    const timedOut = error instanceof Error && error.message === 'assistant-timeout'
    payload.logger.error({ err: error, msg: 'ai-assistant' })
    return NextResponse.json(
      { error: timedOut ? 'AI assistant timed out. Please try again.' : 'AI assistant request failed.' },
      { status: timedOut ? 504 : 500 },
    )
  }
}

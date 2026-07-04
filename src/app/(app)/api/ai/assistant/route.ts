import { runShoppingAssistant } from '@/lib/ai/agent'
import type { AiShoppingToolContext } from '@/lib/ai/checkoutTools'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { callerOwnsCart } from '@/lib/carts/cartAccess'
import { withAiPostHandler } from '@/lib/ai/rateLimit'
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

const _postHandler = async (request: Request, _ctx: any): Promise<Response> => {
  if (!isAiShoppingAssistantEnabled()) {
    return NextResponse.json({ error: 'AI shopping assistant is not configured.' }, { status: 503 })
  }

  const payload = await getPayload({ config: configPromise })

  let body: {
    context?: { cartId?: unknown; district?: unknown }
    cartSecret?: unknown
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

  // Build a SERVER-TRUSTED tool context. The client may only *propose* a cartId
  // (and district); identity (userId/userEmail) and cart ownership are resolved
  // here so a caller cannot read another shopper's cart or loyalty balance by
  // supplying arbitrary ids.
  const auth = await payload.auth({ headers: request.headers })
  const authedUserId =
    auth.user && typeof auth.user.id === 'number' ? auth.user.id
    : auth.user && auth.user.id != null ? Number(auth.user.id)
    : null

  const context: AiShoppingToolContext = {}
  if (authedUserId != null) {
    context.userId = authedUserId
    if (typeof auth.user?.email === 'string') context.userEmail = auth.user.email
  }
  if (typeof body.context?.district === 'string' && body.context.district.trim()) {
    context.district = body.context.district.trim()
  }
  const requestedCartId =
    typeof body.context?.cartId === 'number' ? body.context.cartId : undefined
  const cartSecret = typeof body.cartSecret === 'string' ? body.cartSecret : undefined
  if (
    requestedCartId != null &&
    (await callerOwnsCart({
      cartId: requestedCartId,
      payload,
      secret: cartSecret,
      userId: authedUserId,
    }))
  ) {
    context.cartId = requestedCartId
  }

  try {
    const result = await Promise.race([
      runShoppingAssistant({
        context,
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

// Most expensive AI endpoint (agentic LLM + tool loop) — tighter budget than the default.
export const POST = withAiPostHandler(_postHandler, { limit: 10, windowMs: 60_000 })

import { AI_CHAT_PRODUCT_DISPLAY_LIMIT, isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { callDeepSeekChat, type DeepSeekMessage } from '@/lib/ai/deepseek'
import { executeAiShoppingTool } from '@/lib/ai/executeTool'
import { rankAiProducts } from '@/lib/ai/formatProduct'
import { ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT } from '@/lib/ai/systemPrompt'
import type { AiProductResult } from '@/lib/ai/types'
import { dedupeAiProducts } from '@/lib/chat/productMessage'
import { BDT } from '@/lib/ecommerceCurrency'
import type { Payload } from 'payload'

const MAX_TOOL_ROUNDS = 5
const PRICE_MINOR_FACTOR = 10 ** BDT.decimals

export type ShoppingAssistantInput = {
  payload: Payload
  userMessage: string
  history?: { role: 'user' | 'assistant' | 'system'; content: string }[]
}

export type ShoppingAssistantResult = {
  reply: string
  products: AiProductResult[]
  usedTools: string[]
  handoffToHuman: boolean
}

function extractProductsFromToolResult(raw: string): AiProductResult[] {
  try {
    const parsed = JSON.parse(raw) as { products?: AiProductResult[] }
    return Array.isArray(parsed.products) ? parsed.products : []
  } catch {
    return []
  }
}

function toMajorPrice(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.round((value / PRICE_MINOR_FACTOR) * 100) / 100
}

function toModelToolResult(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      products?: Array<Record<string, unknown>>
      [key: string]: unknown
    }

    if (!Array.isArray(parsed.products)) return raw

    const products = parsed.products.map((product) => ({
      ...product,
      price: toMajorPrice(product.price),
      priceHigh: toMajorPrice(product.priceHigh),
      salePrice: toMajorPrice(product.salePrice),
      salePriceHigh: toMajorPrice(product.salePriceHigh),
    }))

    return JSON.stringify({ ...parsed, products })
  } catch {
    return raw
  }
}

const HUMAN_HANDOFF_RE =
  /\b(human|live agent|real person|customer support|support agent|talk to someone|speak to someone)\b/i

export async function runShoppingAssistant(
  input: ShoppingAssistantInput,
): Promise<ShoppingAssistantResult | null> {
  if (!isAiShoppingAssistantEnabled()) return null

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT },
    ...(input.history ?? []).map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
    { role: 'user', content: input.userMessage },
  ]

  const usedTools: string[] = []
  const collectedProducts: AiProductResult[] = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await callDeepSeekChat({ messages, tools: true })
    const assistantMessage = completion.choices?.[0]?.message

    if (!assistantMessage) {
      throw new Error('DeepSeek returned an empty response.')
    }

    const toolCalls = assistantMessage.tool_calls ?? []

    if (!toolCalls.length) {
      const reply = assistantMessage.content?.trim() || 'I could not find an answer right now.'
      const products = rankAiProducts(dedupeAiProducts(collectedProducts)).slice(
        0,
        AI_CHAT_PRODUCT_DISPLAY_LIMIT,
      )
      return {
        handoffToHuman: HUMAN_HANDOFF_RE.test(input.userMessage) || HUMAN_HANDOFF_RE.test(reply),
        products,
        reply,
        usedTools,
      }
    }

    messages.push({
      content: assistantMessage.content ?? null,
      role: 'assistant',
      tool_calls: toolCalls,
    })

    for (const toolCall of toolCalls) {
      usedTools.push(toolCall.function.name)
      const toolResult = await executeAiShoppingTool({
        payload: input.payload,
        rawArguments: toolCall.function.arguments,
        toolName: toolCall.function.name,
      })

      collectedProducts.push(...extractProductsFromToolResult(toolResult))

      messages.push({
        content: toModelToolResult(toolResult),
        role: 'tool',
        tool_call_id: toolCall.id,
      })
    }
  }

  const finalCompletion = await callDeepSeekChat({ messages, tools: false })
  const reply =
    finalCompletion.choices?.[0]?.message?.content?.trim() ||
    'I found some options but need a moment to summarize them.'
  const products = rankAiProducts(dedupeAiProducts(collectedProducts)).slice(
    0,
    AI_CHAT_PRODUCT_DISPLAY_LIMIT,
  )

  return {
    handoffToHuman: HUMAN_HANDOFF_RE.test(input.userMessage) || HUMAN_HANDOFF_RE.test(reply),
    products,
    reply,
    usedTools,
  }
}

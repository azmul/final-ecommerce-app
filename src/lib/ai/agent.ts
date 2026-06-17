import { AI_CHAT_PRODUCT_DISPLAY_LIMIT, isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { getProductSearchRelevanceConfig } from '@/lib/search/productRelevance'
import type { AiShoppingToolContext } from '@/lib/ai/checkoutTools'
import { callLlmChat, type LlmMessage } from '@/lib/ai/llm'
import { executeAiShoppingTool } from '@/lib/ai/executeTool'
import { rankAiProducts } from '@/lib/ai/formatProduct'
import { ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT } from '@/lib/ai/systemPrompt'
import type { AiProductResult, KnowledgeChunkResult } from '@/lib/ai/types'
import { dedupeAiProducts } from '@/lib/chat/productMessage'
import { BDT } from '@/lib/ecommerceCurrency'
import type { Payload } from 'payload'

const MAX_TOOL_ROUNDS = 5
const KNOWLEDGE_DISPLAY_LIMIT = 6
const PRICE_MINOR_FACTOR = 10 ** BDT.decimals

export type ShoppingAssistantInput = {
  context?: AiShoppingToolContext
  payload: Payload
  userMessage: string
  history?: { role: 'user' | 'assistant' | 'system'; content: string }[]
}

export type ShoppingAssistantResult = {
  reply: string
  products: AiProductResult[]
  knowledgeChunks: KnowledgeChunkResult[]
  usedTools: string[]
  handoffToHuman: boolean
}

export function extractKnowledgeFromToolResult(raw: string): KnowledgeChunkResult[] {
  try {
    const parsed = JSON.parse(raw) as { chunks?: KnowledgeChunkResult[] }
    return Array.isArray(parsed.chunks) ? parsed.chunks : []
  } catch {
    return []
  }
}

export function dedupeKnowledgeChunks(chunks: KnowledgeChunkResult[]): KnowledgeChunkResult[] {
  const seen = new Set<string>()
  const unique: KnowledgeChunkResult[] = []

  for (const chunk of chunks) {
    const key = `${chunk.sourceType}-${chunk.sourceId}-${chunk.text.slice(0, 80)}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(chunk)
  }

  return unique.sort((a, b) => b.score - a.score)
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

function filterRelevantAssistantProducts(products: AiProductResult[]): AiProductResult[] {
  const { minTextRelevance } = getProductSearchRelevanceConfig()
  const minScore = minTextRelevance * 10

  return products.filter((product) => {
    if (product.relevanceScore == null) return true
    return product.relevanceScore >= minScore
  })
}

function buildAssistantResult(args: {
  collectedKnowledge: KnowledgeChunkResult[]
  collectedProducts: AiProductResult[]
  input: ShoppingAssistantInput
  reply: string
  usedTools: string[]
}): ShoppingAssistantResult {
  const products = filterRelevantAssistantProducts(
    rankAiProducts(dedupeAiProducts(args.collectedProducts)),
  ).slice(0, AI_CHAT_PRODUCT_DISPLAY_LIMIT)

  const knowledgeChunks = dedupeKnowledgeChunks(args.collectedKnowledge).slice(
    0,
    KNOWLEDGE_DISPLAY_LIMIT,
  )

  return {
    handoffToHuman:
      HUMAN_HANDOFF_RE.test(args.input.userMessage) || HUMAN_HANDOFF_RE.test(args.reply),
    knowledgeChunks,
    products,
    reply: args.reply,
    usedTools: args.usedTools,
  }
}

export async function runShoppingAssistant(
  input: ShoppingAssistantInput,
): Promise<ShoppingAssistantResult | null> {
  if (!isAiShoppingAssistantEnabled()) return null

  const contextNote =
    input.context ?
      (() => {
        const { userEmail: _, ...safeContext } = input.context
        return `\n\nShopper context (use for checkout tools when relevant):\n${JSON.stringify(safeContext)}`
      })()
    : ''

  const messages: LlmMessage[] = [
    { role: 'system', content: `${ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT}${contextNote}` },
    ...(input.history ?? []).map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
    { role: 'user', content: input.userMessage },
  ]

  const usedTools: string[] = []
  const collectedProducts: AiProductResult[] = []
  const collectedKnowledge: KnowledgeChunkResult[] = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await callLlmChat({ messages, tools: true })
    const assistantMessage = completion.choices?.[0]?.message

    if (!assistantMessage) {
      throw new Error('LLM returned an empty response.')
    }

    const toolCalls = assistantMessage.tool_calls ?? []

    if (!toolCalls.length) {
      const reply = assistantMessage.content?.trim() || 'I could not find an answer right now.'
      return buildAssistantResult({
        collectedKnowledge,
        collectedProducts,
        input,
        reply,
        usedTools,
      })
    }

    messages.push({
      content: assistantMessage.content ?? null,
      role: 'assistant',
      tool_calls: toolCalls,
    })

    for (const toolCall of toolCalls) {
      usedTools.push(toolCall.function.name)
    }

    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const toolResult = await executeAiShoppingTool({
          context: input.context,
          payload: input.payload,
          rawArguments: toolCall.function.arguments,
          toolName: toolCall.function.name,
        })

        return { toolCall, toolResult }
      }),
    )

    for (const { toolCall, toolResult } of toolResults) {
      collectedProducts.push(...extractProductsFromToolResult(toolResult))
      if (toolCall.function.name === 'searchKnowledgeBase') {
        collectedKnowledge.push(...extractKnowledgeFromToolResult(toolResult))
      }

      messages.push({
        content: toModelToolResult(toolResult),
        role: 'tool',
        tool_call_id: toolCall.id,
      })
    }
  }

  const finalCompletion = await callLlmChat({ messages, tools: false })
  const reply =
    finalCompletion.choices?.[0]?.message?.content?.trim() ||
    'I found some options but need a moment to summarize them.'

  return buildAssistantResult({
    collectedKnowledge,
    collectedProducts,
    input,
    reply,
    usedTools,
  })
}

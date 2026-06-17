import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { executeAiShoppingTool } from '@/lib/ai/executeTool'
import { searchKnowledgeBaseForAi } from '@/lib/ai/rag/searchKnowledgeBase'
import { searchProductsForAi } from '@/lib/ai/searchProducts'
import { semanticSearchForAi } from '@/lib/ai/semanticSearch'
import { ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT } from '@/lib/ai/systemPrompt'
import { AI_SHOPPING_TOOLS } from '@/lib/ai/tools'
import { extractKnowledgeFromToolResult } from '@/lib/ai/agent'
import config from '@/payload.config'

let payload: Payload

describe('ai product search', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('exposes strict shopping assistant prompt and tools', () => {
    expect(ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT).toContain('searchProducts')
    expect(ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT).toContain('semanticSearch')
    expect(ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT).toContain('Never invent products')
    expect(ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT).toContain('Bangla')
    expect(AI_SHOPPING_TOOLS.map((tool) => tool.function.name)).toEqual([
      'searchProducts',
      'semanticSearch',
      'getShippingQuote',
      'listActivePromoCodes',
      'checkPromoCode',
      'getLoyaltyBalance',
      'explainCheckoutStep',
      'searchKnowledgeBase',
      'getRecommendations',
    ])
  })

  it('searches published products with structured filters', async () => {
    const result = await searchProductsForAi(payload, {
      inStockOnly: false,
      limit: 5,
      query: 'a',
    })

    expect(Array.isArray(result.products)).toBe(true)
    expect(result.total).toBeGreaterThanOrEqual(0)
    for (const product of result.products) {
      expect(product.id).toBeTypeOf('number')
      expect(product.title).toBeTypeOf('string')
      expect(product.url).toContain('/products/')
    }
  })

  it('runs semantic text search fallback', async () => {
    const result = await semanticSearchForAi(payload, {
      limit: 5,
      query: 'comfortable everyday product',
    })

    expect(['text', 'vector']).toContain(result.method)
    expect(Array.isArray(result.products)).toBe(true)
  })

  it('executes searchProducts tool arguments', async () => {
    const raw = await executeAiShoppingTool({
      payload,
      rawArguments: JSON.stringify({
        color: 'blue',
        maxPrice: 1000,
        query: 'shirt',
      }),
      toolName: 'searchProducts',
    })

    const parsed = JSON.parse(raw) as { products: unknown[]; total: number }
    expect(Array.isArray(parsed.products)).toBe(true)
    expect(parsed.total).toBeGreaterThanOrEqual(0)
  })

  it('executes listActivePromoCodes tool', async () => {
    const raw = await executeAiShoppingTool({
      payload,
      rawArguments: JSON.stringify({ limit: 5 }),
      toolName: 'listActivePromoCodes',
    })

    const parsed = JSON.parse(raw) as { promos: unknown[]; total: number }
    expect(Array.isArray(parsed.promos)).toBe(true)
    expect(parsed.total).toBe(parsed.promos.length)
  })

  it('extracts knowledge chunks from searchKnowledgeBase tool output shape', async () => {
    const raw = await executeAiShoppingTool({
      payload,
      rawArguments: JSON.stringify({ limit: 2, query: 'return policy' }),
      toolName: 'searchKnowledgeBase',
    })

    const chunks = extractKnowledgeFromToolResult(raw)
    expect(Array.isArray(chunks)).toBe(true)
  })

  it('searches the knowledge base with hybrid RAG retrieval', async () => {
    const result = await searchKnowledgeBaseForAi(payload, {
      limit: 3,
      query: 'return policy',
    })

    expect(Array.isArray(result.chunks)).toBe(true)
    for (const chunk of result.chunks) {
      expect(chunk.sourceId).toBeTypeOf('number')
      expect(chunk.sourceType).toBeTypeOf('string')
      expect(chunk.text).toBeTypeOf('string')
      expect(chunk.score).toBeTypeOf('number')
    }
  })
})

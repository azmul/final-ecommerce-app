import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { executeAiShoppingTool } from '@/lib/ai/executeTool'
import { searchProductsForAi } from '@/lib/ai/searchProducts'
import { semanticSearchForAi } from '@/lib/ai/semanticSearch'
import { ECOMMERCE_AI_SHOPPING_ASSISTANT_PROMPT } from '@/lib/ai/systemPrompt'
import { AI_SHOPPING_TOOLS } from '@/lib/ai/tools'
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
    expect(AI_SHOPPING_TOOLS.map((tool) => tool.function.name)).toEqual([
      'searchProducts',
      'semanticSearch',
      'getShippingQuote',
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
})

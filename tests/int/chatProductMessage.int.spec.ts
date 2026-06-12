import { describe, expect, it } from 'vitest'

import type { AiProductResult } from '@/lib/ai/types'
import {
  chatMessageInboxBody,
  chatMessagePreview,
  dedupeAiProducts,
  encodeProductMessage,
  encodeRichMessage,
  parseChatMessageBody,
} from '@/lib/chat/productMessage'

const sampleProduct: AiProductResult = {
  brand: 'Nike',
  categories: ['Shoes'],
  colors: ['black'],
  discountPercentage: 10,
  enableVariants: false,
  id: 1,
  imageUrl: 'http://localhost:3000/media/shoe.jpg',
  inStock: true,
  materials: [],
  price: 100,
  rating: 4.5,
  relevanceScore: 1,
  reviewCount: 12,
  salePrice: 90,
  sizes: [],
  slug: 'black-shoe',
  title: 'Black Shoe',
  url: 'http://localhost:3000/products/black-shoe',
  variantId: null,
}

describe('chat product messages', () => {
  it('encodes and parses assistant payloads with knowledge chunks', () => {
    const encoded = encodeRichMessage({
      kind: 'assistant_results',
      knowledgeChunks: [
        {
          score: 0.88,
          sourceId: 3,
          sourceType: 'page',
          text: 'Free returns within 30 days.',
          title: 'Returns policy',
        },
      ],
      text: 'Here is our return policy.',
    })

    const parsed = parseChatMessageBody(encoded)
    expect(parsed.text).toBe('Here is our return policy.')
    expect(parsed.knowledgeChunks).toHaveLength(1)
    expect(parsed.knowledgeChunks[0]?.title).toBe('Returns policy')
  })

  it('encodes and parses product result payloads', () => {
    const encoded = encodeProductMessage({
      kind: 'product_results',
      products: [sampleProduct],
      text: 'I found 1 matching product.',
    })

    const parsed = parseChatMessageBody(encoded)
    expect(parsed.text).toBe('I found 1 matching product.')
    expect(parsed.products).toHaveLength(1)
    expect(parsed.products[0]?.title).toBe('Black Shoe')
  })

  it('falls back to plain text bodies', () => {
    const parsed = parseChatMessageBody('Hello from support')
    expect(parsed.text).toBe('Hello from support')
    expect(parsed.products).toEqual([])
  })

  it('dedupes products by id', () => {
    const deduped = dedupeAiProducts([sampleProduct, { ...sampleProduct, title: 'Duplicate' }])
    expect(deduped).toHaveLength(1)
  })

  it('uses readable preview text for product payloads', () => {
    const encoded = encodeProductMessage({
      kind: 'product_results',
      products: [sampleProduct],
      text: 'I found 1 matching product.',
    })

    expect(chatMessagePreview(encoded)).toBe('I found 1 matching product.')
    expect(chatMessageInboxBody(encoded)).toBe(encoded)
  })

  it('truncates plain text previews', () => {
    const longBody = 'a'.repeat(250)
    expect(chatMessagePreview(longBody)).toHaveLength(200)
    expect(chatMessagePreview(longBody).endsWith('...')).toBe(true)
  })

  it('formats truncated product_results JSON stored in lastMessagePreview', () => {
    const truncated =
      '{"kind":"product_results","products":[{"brand":"GARAVAST","categories":["Oil"],"id":1,"title":"Mustard Oil"}],"text":"Yes, there is! Here\'s the details:"}'

    expect(chatMessagePreview(truncated)).toBe("Yes, there is! Here's the details:")
  })

  it('falls back when product_results JSON is cut off mid-payload', () => {
    const truncated = '{"kind":"product_results","products":[{"brand":"GARAVAST","categories":'

    expect(chatMessagePreview(truncated)).toBe('Product recommendations')
  })

  it('strips markdown from plain text previews', () => {
    const markdown =
      "Yes, there is! Here's the details: ### 🛒 **Deshi Mustard Oil 5 liter — GARAVAST** - In stock"

    expect(chatMessagePreview(markdown)).toBe(
      "Yes, there is! Here's the details: 🛒 Deshi Mustard Oil 5 liter — GARAVAST - In stock",
    )
  })
})

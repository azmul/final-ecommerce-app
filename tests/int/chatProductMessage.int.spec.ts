import { describe, expect, it } from 'vitest'

import type { AiProductResult } from '@/lib/ai/types'
import {
  dedupeAiProducts,
  encodeProductMessage,
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
})

import { buildFaqChunk, chunkPlainText } from '@/lib/ai/rag/chunkText'
import { extractDocumentChunks } from '@/lib/ai/rag/extractDocument'
import { expandRagQueries } from '@/lib/ai/rag/queryExpansion'
import { resolveSourceUrl } from '@/lib/ai/rag/resolveSourceUrl'
import {
  dedupeKnowledgeMatches,
  lexicalOverlapScore,
  reciprocalRankFusion,
  rerankKnowledgeMatches,
  tokenizeForRag,
} from '@/lib/ai/rag/rerank'
import { describe, expect, it } from 'vitest'

describe('rag chunking and ranking', () => {
  it('creates one chunk per FAQ entry', () => {
    const chunk = buildFaqChunk({
      answer: 'Within 7 days.',
      chunkIndex: 0,
      question: 'How long do returns take?',
      sourceSlug: 'returns',
      title: 'Returns Policy',
    })

    expect(chunk.chunkText).toContain('Q: How long do returns take?')
    expect(chunk.chunkText).toContain('[Returns Policy]')
    expect(chunk.sourceSlug).toBe('returns')
  })

  it('splits long policy text into overlapping chunks', () => {
    const text = Array.from({ length: 8 }, (_, index) => `Paragraph ${index + 1}. `.repeat(20)).join('\n\n')
    const chunks = chunkPlainText({
      maxChars: 400,
      overlap: 50,
      sourceSlug: 'shipping',
      text,
      title: 'Shipping Policy',
    })

    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]?.title).toBe('Shipping Policy')
  })

  it('expands shipping and return queries for retrieval', () => {
    const variants = expandRagQueries('shipping time to Dhaka')
    expect(variants[0]).toBe('shipping time to Dhaka')
    expect(variants.some((variant) => variant.includes('delivery'))).toBe(true)
  })

  it('reranks vector matches with lexical overlap', () => {
    const reranked = rerankKnowledgeMatches({
      matches: [
        {
          chunkText: 'Delivery to Dhaka usually takes 3-5 business days nationwide.',
          score: 0.55,
          sourceId: 1,
          sourceType: 'policy',
          title: 'Shipping',
          vectorScore: 0.55,
        },
        {
          chunkText: 'Contact support for account issues.',
          score: 0.58,
          sourceId: 2,
          sourceType: 'policy',
          title: 'Contact',
          vectorScore: 0.58,
        },
      ],
      minScore: 0.2,
      query: 'delivery time dhaka',
    })

    expect(reranked[0]?.title).toBe('Shipping')
  })

  it('merges vector and keyword lists with reciprocal rank fusion', () => {
    const merged = reciprocalRankFusion([
      [
        { item: 'a', key: 'a' },
        { item: 'b', key: 'b' },
      ],
      [
        { item: 'b', key: 'b' },
        { item: 'c', key: 'c' },
      ],
    ])

    expect(merged[0]).toBe('b')
  })

  it('tokenizes Bangla and English terms for keyword search', () => {
    const terms = tokenizeForRag('return policy রিটার্ন')
    expect(terms).toContain('return')
    expect(terms).toContain('policy')
    expect(terms).toContain('রিটার্ন')
    expect(lexicalOverlapScore('return policy', 'Our return policy allows 7 days.')).toBeGreaterThan(0.4)
  })

  it('dedupes repeated knowledge chunks', () => {
    const deduped = dedupeKnowledgeMatches([
      {
        chunkText: 'Same answer',
        score: 0.8,
        sourceId: 1,
        sourceType: 'policy',
      },
      {
        chunkText: 'Same answer',
        score: 0.7,
        sourceId: 1,
        sourceType: 'policy',
      },
    ])

    expect(deduped).toHaveLength(1)
  })

  it('extracts chunks from CMS page and product documents', () => {
    const pageChunks = extractDocumentChunks({
      collection: 'pages',
      doc: {
        _status: 'published',
        id: 1,
        layout: [
          {
            blockType: 'faq',
            faqs: [{ answer: '7 days.', question: 'Return window?' }],
          },
        ],
        slug: 'returns',
        title: 'Returns Policy',
      },
    })

    expect(pageChunks.length).toBeGreaterThan(0)
    expect(pageChunks[0]?.sourceUrl).toContain('/returns')

    const productChunks = extractDocumentChunks({
      collection: 'products',
      doc: {
        _status: 'published',
        id: 2,
        seoContent: {
          faqs: [{ answer: 'Cotton blend.', question: 'Material?' }],
        },
        slug: 'blue-shirt',
        title: 'Blue Shirt',
      },
    })

    expect(productChunks.some((chunk) => chunk.chunkText.includes('Material?'))).toBe(true)
    expect(resolveSourceUrl({ collection: 'products', slug: 'blue-shirt' })).toContain('/products/blue-shirt')
  })
})

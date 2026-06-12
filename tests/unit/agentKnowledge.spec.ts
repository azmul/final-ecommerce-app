import { describe, expect, it } from 'vitest'

import {
  dedupeKnowledgeChunks,
  extractKnowledgeFromToolResult,
} from '@/lib/ai/agent'
import type { KnowledgeChunkResult } from '@/lib/ai/types'

const sampleChunk = (overrides: Partial<KnowledgeChunkResult> = {}): KnowledgeChunkResult => ({
  score: 0.9,
  sourceId: 1,
  sourceType: 'page',
  text: 'Return policy allows 30 day returns.',
  title: 'Returns',
  ...overrides,
})

describe('extractKnowledgeFromToolResult', () => {
  it('parses knowledge chunks from tool JSON', () => {
    const raw = JSON.stringify({
      chunks: [sampleChunk(), sampleChunk({ sourceId: 2, text: 'Shipping info.' })],
    })

    const chunks = extractKnowledgeFromToolResult(raw)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]?.title).toBe('Returns')
  })

  it('returns empty array for invalid JSON', () => {
    expect(extractKnowledgeFromToolResult('not-json')).toEqual([])
    expect(extractKnowledgeFromToolResult(JSON.stringify({ products: [] }))).toEqual([])
  })
})

describe('dedupeKnowledgeChunks', () => {
  it('dedupes by source and text prefix', () => {
    const deduped = dedupeKnowledgeChunks([
      sampleChunk(),
      sampleChunk({ score: 0.5 }),
      sampleChunk({ sourceId: 2, text: 'Other page.' }),
    ])

    expect(deduped).toHaveLength(2)
    expect(deduped[0]?.score).toBe(0.9)
  })
})

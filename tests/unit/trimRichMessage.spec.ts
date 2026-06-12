import { describe, expect, it } from 'vitest'

import type { KnowledgeChunkResult } from '@/lib/ai/types'
import { trimKnowledgeChunksForStorage } from '@/lib/chat/trimRichMessageForStorage'

describe('trimKnowledgeChunksForStorage', () => {
  it('truncates long chunk text for chat persistence', () => {
    const longText = 'a'.repeat(500)
    const chunks: KnowledgeChunkResult[] = [
      {
        score: 0.9,
        sourceId: 1,
        sourceType: 'page',
        text: longText,
        title: 'Policy',
      },
    ]

    const trimmed = trimKnowledgeChunksForStorage(chunks)
    expect(trimmed[0]?.text.length).toBeLessThanOrEqual(400)
    expect(trimmed[0]?.text.endsWith('...')).toBe(true)
  })

  it('leaves short chunk text unchanged', () => {
    const chunks: KnowledgeChunkResult[] = [
      {
        score: 0.9,
        sourceId: 1,
        sourceType: 'page',
        text: 'Short policy excerpt.',
        title: 'Policy',
      },
    ]

    expect(trimKnowledgeChunksForStorage(chunks)[0]?.text).toBe('Short policy excerpt.')
  })
})

import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/ai/rag/syncAllContent', () => ({
  syncAllSiteContent: vi.fn().mockResolvedValue({ synced: 4 }),
}))

vi.mock('@/lib/ai/syncAllProductEmbeddings', () => ({
  syncAllProductEmbeddings: vi.fn().mockResolvedValue({ skipped: 1, synced: 12 }),
}))

import { syncAllEmbeddings } from '@/lib/ai/syncAllEmbeddings'

describe('syncAllEmbeddings', () => {
  it('merges content and product embedding sync counts', async () => {
    const result = await syncAllEmbeddings({} as import('payload').Payload)

    expect(result).toEqual({
      contentSynced: 4,
      productEmbeddingsSkipped: 1,
      productEmbeddingsSynced: 12,
      synced: 4,
    })
  })
})

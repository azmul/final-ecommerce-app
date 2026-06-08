import { describe, expect, it } from 'vitest'

import {
  buildProductTextSearchWhere,
  passesTextRelevanceThreshold,
  passesVectorRelevanceThreshold,
  scoreProductTextRelevance,
} from '@/lib/search/productRelevance'

describe('product relevance helpers', () => {
  it('builds token-aware text search clauses', () => {
    const where = buildProductTextSearchWhere('blue cotton shirt')
    expect(where).toBeTruthy()
    expect(where?.or?.length).toBeGreaterThan(2)
  })

  it('scores overlapping catalog text higher', () => {
    const high = scoreProductTextRelevance('Blue cotton shirt for summer', 'blue cotton shirt')
    const low = scoreProductTextRelevance('Leather wallet brown', 'blue cotton shirt')
    expect(high).toBeGreaterThan(low)
  })

  it('filters weak text matches', () => {
    expect(passesTextRelevanceThreshold(0.05, 'blue cotton shirt')).toBe(false)
    expect(passesTextRelevanceThreshold(0.4, 'blue cotton shirt')).toBe(true)
  })

  it('filters weak vector matches', () => {
    expect(passesVectorRelevanceThreshold(0.1)).toBe(false)
    expect(passesVectorRelevanceThreshold(0.3)).toBe(true)
  })
})

import { lexicalOverlapScore, tokenizeForRag } from '@/lib/ai/rag/rerank'
import type { Where } from 'payload'

export function getProductSearchRelevanceConfig() {
  const minVector = Number(process.env.PRODUCT_MIN_VECTOR_SCORE)
  const minText = Number(process.env.PRODUCT_MIN_TEXT_RELEVANCE)

  return {
    candidateMultiplier: 5,
    maxCandidates: 100,
    minTextRelevance: Number.isFinite(minText) && minText > 0 ? minText : 0.2,
    minVectorScore: Number.isFinite(minVector) && minVector > 0 ? minVector : 0.22,
  }
}

export function buildProductTextSearchWhere(searchValue: string): Where | null {
  const query = searchValue.trim()
  if (!query) return null

  const tokens = tokenizeForRag(query)
  const or: Where[] = [{ title: { like: query } }, { slug: { like: query } }]

  for (const token of tokens) {
    or.push({ title: { contains: token } }, { slug: { contains: token } })
  }

  if (!tokens.length) {
    or.push({ title: { contains: query } }, { slug: { contains: query } })
  }

  return { or }
}

export function scoreProductTextRelevance(searchText: string, query: string): number {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return 0

  const lexical = lexicalOverlapScore(normalizedQuery, searchText)
  const haystack = searchText.toLowerCase()
  const needle = normalizedQuery.toLowerCase()

  let bonus = 0
  if (haystack.includes(needle)) bonus += 0.35

  for (const token of tokenizeForRag(normalizedQuery)) {
    if (haystack.includes(token)) bonus += 0.05
  }

  return Math.min(1, lexical + bonus)
}

export function passesTextRelevanceThreshold(score: number, query: string): boolean {
  const { minTextRelevance } = getProductSearchRelevanceConfig()
  const tokens = tokenizeForRag(query)

  if (!tokens.length) return score > 0
  if (tokens.length === 1) return score >= Math.min(minTextRelevance, 0.15)

  return score >= minTextRelevance
}

export function passesVectorRelevanceThreshold(score: number): boolean {
  return score >= getProductSearchRelevanceConfig().minVectorScore
}

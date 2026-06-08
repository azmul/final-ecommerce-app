import type { AiProductResult } from '@/lib/ai/types'

export type AiSearchMode = 'assistant' | 'products' | 'semantic' | 'knowledge'

export type KnowledgeChunkResult = {
  score: number
  sourceCollection?: string
  sourceId: number
  sourceSlug?: string
  sourceType: string
  sourceUrl?: string
  text: string
  title?: string
}

export type AiSearchMessage = {
  id: string
  role: 'user' | 'assistant'
  body: string
  createdAt: string
  products?: AiProductResult[]
  knowledgeChunks?: KnowledgeChunkResult[]
  mode: AiSearchMode
  usedTools?: string[]
}

export type ProductSort = 'relevance' | 'price-asc' | 'price-desc'

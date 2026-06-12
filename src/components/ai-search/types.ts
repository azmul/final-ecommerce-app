import type { AiProductResult, KnowledgeChunkResult } from '@/lib/ai/types'

export type AiSearchMode = 'assistant' | 'products' | 'semantic' | 'knowledge'

export type { KnowledgeChunkResult }

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

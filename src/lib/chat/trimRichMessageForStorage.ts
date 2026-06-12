import type { KnowledgeChunkResult } from '@/lib/ai/types'
import type { AiProductResult } from '@/lib/ai/types'

const KNOWLEDGE_TEXT_STORAGE_LIMIT = 400

export function trimKnowledgeChunksForStorage(
  chunks: KnowledgeChunkResult[],
): KnowledgeChunkResult[] {
  return chunks.map((chunk) => {
    if (chunk.text.length <= KNOWLEDGE_TEXT_STORAGE_LIMIT) return chunk
    return {
      ...chunk,
      text: `${chunk.text.slice(0, KNOWLEDGE_TEXT_STORAGE_LIMIT - 3)}...`,
    }
  })
}

export function trimProductsForStorage(products: AiProductResult[]): AiProductResult[] {
  return products.map(({ whyItMatches: _, ...product }) => product)
}

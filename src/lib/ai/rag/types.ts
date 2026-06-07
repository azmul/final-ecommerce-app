export type KnowledgeChunkInput = {
  chunkIndex: number
  chunkText: string
  sourceCollection?: string
  sourceSlug?: string
  sourceUrl?: string
  title?: string
}

export type KnowledgeSearchMatch = {
  chunkText: string
  score: number
  sourceCollection?: string
  sourceId: number
  sourceSlug?: string
  sourceType: string
  sourceUrl?: string
  title?: string
  vectorScore?: number
}

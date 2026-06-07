import { getRagConfig } from '@/lib/ai/config'
import { createEmbedding } from '@/lib/ai/embeddings'
import {
  keywordSearchContentEmbeddings,
  searchContentEmbeddings,
} from '@/lib/ai/rag/contentEmbeddings'
import { expandRagQueries } from '@/lib/ai/rag/queryExpansion'
import {
  dedupeKnowledgeMatches,
  reciprocalRankFusion,
  rerankKnowledgeMatches,
} from '@/lib/ai/rag/rerank'
import type { KnowledgeSearchMatch } from '@/lib/ai/rag/types'

export { syncAllSiteContent, syncKnowledgeBaseFromPages } from '@/lib/ai/rag/syncAllContent'

type RankedKnowledgeMatch = {
  key: string
  match: KnowledgeSearchMatch
}

export async function searchKnowledgeBaseForAi(
  payload: import('payload').Payload,
  args: { limit?: number; query: string },
): Promise<{
  chunks: {
    score: number
    sourceCollection?: string
    sourceId: number
    sourceSlug?: string
    sourceType: string
    sourceUrl?: string
    text: string
    title?: string
  }[]
}> {
  const query = args.query.trim()
  if (!query) return { chunks: [] }

  const ragConfig = getRagConfig()
  const limit = Math.min(Math.max(args.limit ?? ragConfig.defaultLimit, 1), ragConfig.maxLimit)
  const candidateLimit = limit * ragConfig.vectorCandidateMultiplier
  const queryVariants = expandRagQueries(query)

  const vectorLists: RankedKnowledgeMatch[][] = []

  for (const variant of queryVariants) {
    const embedding = await createEmbedding(variant)
    if (!embedding) continue

    const matches = await searchContentEmbeddings({
      limit: candidateLimit,
      payload,
      queryEmbedding: embedding,
    })

    vectorLists.push(
      matches.map((match) => ({
        key: `${match.sourceType}:${match.sourceId}:${match.chunkText.slice(0, 80)}`,
        match: {
          ...match,
          vectorScore: match.vectorScore ?? match.score,
        },
      })),
    )
  }

  const keywordMatches = await keywordSearchContentEmbeddings({
    limit: candidateLimit,
    payload,
    query,
  })

  const keywordRanked: RankedKnowledgeMatch[] = keywordMatches.map((match) => ({
    key: `${match.sourceType}:${match.sourceId}:${match.chunkText.slice(0, 80)}`,
    match: {
      ...match,
      vectorScore: match.vectorScore ?? 0,
    },
  }))

  const fused = reciprocalRankFusion([
    ...vectorLists.map((list) => list.map((entry) => ({ item: entry.match, key: entry.key }))),
    keywordRanked.map((entry) => ({ item: entry.match, key: entry.key })),
  ])

  const reranked = rerankKnowledgeMatches({
    matches: dedupeKnowledgeMatches(fused),
    minScore: ragConfig.minSimilarityScore,
    query,
  }).slice(0, limit)

  if (!reranked.length && keywordMatches.length) {
    const fallback = rerankKnowledgeMatches({
      matches: dedupeKnowledgeMatches(keywordMatches),
      minScore: 0.15,
      query,
    }).slice(0, limit)

    return {
      chunks: fallback.map((match) => ({
        score: match.score,
        sourceCollection: match.sourceCollection,
        sourceId: match.sourceId,
        sourceSlug: match.sourceSlug,
        sourceType: match.sourceType,
        sourceUrl: match.sourceUrl,
        text: match.chunkText,
        title: match.title,
      })),
    }
  }

  return {
    chunks: reranked.map((match) => ({
      score: match.score,
      sourceCollection: match.sourceCollection,
      sourceId: match.sourceId,
      sourceSlug: match.sourceSlug,
      sourceType: match.sourceType,
      sourceUrl: match.sourceUrl,
      text: match.chunkText,
      title: match.title,
    })),
  }
}

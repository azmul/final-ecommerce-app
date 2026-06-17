import type { KnowledgeSearchMatch } from '@/lib/ai/rag/types'

export function tokenizeForRag(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/[\s,.;:!?()[\]{}'"\/\\|<>@#$%^&*+=~`-]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2),
    ),
  ]
}

export function lexicalOverlapScore(query: string, text: string): number {
  const terms = tokenizeForRag(query)
  if (!terms.length) return 0

  const haystack = text.toLowerCase()
  let hits = 0

  for (const term of terms) {
    if (haystack.includes(term)) hits += 1
  }

  return hits / terms.length
}

export function rerankKnowledgeMatches(args: {
  matches: KnowledgeSearchMatch[]
  minScore: number
  query: string
}): KnowledgeSearchMatch[] {
  return args.matches
    .map((match) => {
      const vectorScore = match.vectorScore ?? match.score
      const lexical = lexicalOverlapScore(args.query, match.chunkText)
      const titleLexical =
        match.title ? lexicalOverlapScore(args.query, match.title) * 0.15 : 0
      // Keyword-only rows have vectorScore 0; use lexical directly so they are not dropped.
      const score =
        vectorScore > 0 ?
          vectorScore * 0.72 + lexical * 0.28 + titleLexical
        : Math.min(1, lexical + titleLexical)

      return {
        ...match,
        score,
        vectorScore,
      }
    })
    .filter((match) => {
      if ((match.vectorScore ?? 0) > 0) return match.score >= args.minScore
      return match.score >= Math.min(args.minScore, 0.35)
    })
    .sort((a, b) => b.score - a.score)
}

export function reciprocalRankFusion<T>(
  rankedLists: { item: T; key: string }[][],
  k = 60,
): T[] {
  const scores = new Map<string, { item: T; score: number }>()

  for (const list of rankedLists) {
    list.forEach((entry, index) => {
      const existing = scores.get(entry.key)
      const contribution = 1 / (k + index + 1)

      if (existing) {
        existing.score += contribution
      } else {
        scores.set(entry.key, { item: entry.item, score: contribution })
      }
    })
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
}

export function dedupeKnowledgeMatches(matches: KnowledgeSearchMatch[]): KnowledgeSearchMatch[] {
  const seen = new Set<string>()
  const deduped: KnowledgeSearchMatch[] = []

  for (const match of matches) {
    const key = `${match.sourceType}:${match.sourceId}:${match.chunkText.slice(0, 120)}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(match)
  }

  return deduped
}

/** Admin field hints that were saved as content (e.g. from AI or copy-paste). */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^Concise factual summary \(2[–-]4 sentences\)/i,
  /^Write a concise factual summary/i,
  /^Write a short paragraph explaining why/i,
  /^Write a brief note about delivery/i,
]

export function sanitizeProductSeoText(value: string | null | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed) return null

  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(trimmed)) return null
  }

  return trimmed
}

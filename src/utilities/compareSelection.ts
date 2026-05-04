/** Parse ?ids=1,2,3 from the compare URL — max 3 unique numeric IDs. */
export function parseCompareIdsParam(raw: string | undefined): number[] {
  if (!raw?.trim()) return []

  const ids: number[] = []
  const seen = new Set<string>()

  for (const part of raw.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const n = Number.parseInt(trimmed, 10)
    if (!Number.isFinite(n)) continue

    const key = String(n)
    if (seen.has(key)) continue

    seen.add(key)
    ids.push(n)

    if (ids.length >= 3) break
  }

  return ids
}

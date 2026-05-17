/** Prefer clean slugs (no ---copy) and shorter paths when deduplicating CMS duplicates. */
export function slugQualityScore(slug: string | null | undefined): number {
  if (!slug) return -9999
  const copies = (slug.match(/---copy/g) || []).length
  return -copies * 1000 - slug.length
}

export function normalizeSlugBase(slug: string): string {
  return slug.replace(/---copy.*$/, '').replace(/-\d+$/, '')
}

export function pickCanonicalBySlug<T extends { slug?: string | null; id: string | number }>(
  docs: T[],
): T[] {
  const byBase = new Map<string, T>()

  for (const doc of docs) {
    if (!doc.slug) continue
    const base = normalizeSlugBase(doc.slug)
    const existing = byBase.get(base)
    if (!existing || slugQualityScore(doc.slug) > slugQualityScore(existing.slug)) {
      byBase.set(base, doc)
    }
  }

  return [...byBase.values()]
}

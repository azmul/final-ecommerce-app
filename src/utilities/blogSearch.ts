import type { Where } from 'payload'

const MAX_SEARCH_LEN = 200

/** yyyy-mm-dd only (calendar date in UTC for filtering). */
const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

function utcEndOfCalendarDayUTC(y: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(y, monthIndex, day, 23, 59, 59, 999))
}

/**
 * Parse a URL date param as a UTC calendar day (starts at 00:00:00.000Z).
 * Rejects malformed or invalid calendar dates.
 */
export function parseBlogDateParam(raw: string | undefined | null): Date | undefined {
  if (!raw || typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  const m = trimmed.match(ISO_DATE_ONLY)
  if (!m) return undefined
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return undefined
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return undefined
  const dt = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return undefined
  return dt
}

export type NormalizedPublishedRange = {
  from?: Date
  to?: Date
}

/** Validates two URL date params and ensures from ≤ end-of-to (UTC). */
export function normalizePublishedDateRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
): NormalizedPublishedRange {
  let from = parseBlogDateParam(fromRaw ?? null)
  let to = parseBlogDateParam(toRaw ?? null)
  if (from && to) {
    const end = utcEndOfCalendarDayUTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
    if (from.getTime() > end.getTime()) {
      ;[from, to] = [to, from]
    }
  }
  return { from, to }
}

/** Display a UTC calendar day for filter labels / metadata (not local timezone). */
export function formatBlogUtcDateLabel(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function publishedRangeIsActive(range: NormalizedPublishedRange): boolean {
  return Boolean(range.from || range.to)
}

function postsPublishedDateRangeWhere(range: NormalizedPublishedRange): Where | undefined {
  const { from, to } = range
  if (!from && !to) return undefined

  const clauses: Where[] = []
  if (from) {
    clauses.push({
      publishedOn: {
        greater_than_equal: from.toISOString(),
      },
    })
  }
  if (to) {
    const end = utcEndOfCalendarDayUTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
    clauses.push({
      publishedOn: {
        less_than_equal: end.toISOString(),
      },
    })
  }

  if (clauses.length === 0) return undefined
  if (clauses.length === 1) return clauses[0] as Where
  return { and: clauses }
}

/** Trim and cap length for safe querying. Returns empty string when nothing to search. */
export function normalizeBlogSearchQuery(raw: string | undefined | null): string {
  if (typeof raw !== 'string') return ''
  const t = raw.trim()
  if (!t) return ''
  return t.length > MAX_SEARCH_LEN ? t.slice(0, MAX_SEARCH_LEN) : t
}

/** Coerce Next.js search param (string | string[] | undefined) to a single string. */
export function searchParamToString(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

/**
 * Matches title, excerpt, or SEO meta text (case-insensitive via Payload `contains`).
 */
export function postsTextSearchWhere(trimmedQuery: string): Where | undefined {
  if (!trimmedQuery) return undefined

  return {
    or: [
      { title: { contains: trimmedQuery } },
      { excerpt: { contains: trimmedQuery } },
      { 'meta.title': { contains: trimmedQuery } },
      { 'meta.description': { contains: trimmedQuery } },
    ],
  }
}

export function buildPostsListingWhere(params: {
  draft: boolean
  searchQuery: string
  /** Pass parsed range only (use `normalizePublishedDateRange`). */
  publishedRange?: NormalizedPublishedRange
}): Where {
  const { draft, searchQuery, publishedRange } = params
  const parts: Where[] = []

  if (!draft) {
    parts.push({
      _status: {
        equals: 'published',
      },
    })
  }

  const search = postsTextSearchWhere(searchQuery)
  if (search) {
    parts.push(search)
  }

  const dateWhere =
    publishedRange ? postsPublishedDateRangeWhere(publishedRange) : undefined
  if (dateWhere) {
    parts.push(dateWhere)
  }

  if (parts.length === 0) return {}
  if (parts.length === 1) return parts[0] as Where

  return { and: parts }
}

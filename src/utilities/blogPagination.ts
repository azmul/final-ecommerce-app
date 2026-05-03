import { createUrl } from '@/utilities/createUrl'

/** Keep in sync with `blog/page.tsx` and `/api/blog-search`. */
export const BLOG_POSTS_PER_PAGE = 10 as const

/** Next.js `searchParams` shape passed from app routes. */
export type BlogListSearchParams = {
  [key: string]: string | string[] | undefined
}

const MAX_ALLOWED_PAGE_HINT = 10_000

/**
 * Normalizes URL `page` query to a finite integer ≥ 1 before Payload runs.
 */
export function normalizeBlogListingPage(
  raw: string | string[] | undefined | null,
): number {
  let s: string | undefined
  if (typeof raw === 'string') {
    s = raw.trim()
  } else if (Array.isArray(raw) && typeof raw[0] === 'string') {
    s = raw[0].trim()
  }

  const n = s ? Number.parseInt(s, 10) : NaN
  if (!Number.isFinite(n) || n < 1) return 1

  return Math.min(Math.floor(n), MAX_ALLOWED_PAGE_HINT)
}

/** Build `/blog` href preserving filters; `page` is omitted when ≤ 1. */
export function buildBlogPageHref(
  pathname: string,
  resolved: BlogListSearchParams,
  page: number,
): string {
  const u = new URLSearchParams()
  for (const [key, value] of Object.entries(resolved)) {
    if (key === 'page') continue
    if (value === undefined) continue
    if (Array.isArray(value)) {
      value.forEach((item) => u.append(key, item))
    } else {
      u.set(key, value)
    }
  }

  const safe = Math.floor(page)
  if (safe > 1) {
    u.set('page', String(safe))
  }

  return createUrl(pathname, u)
}

function getBlogVisiblePageNums(current: number, total: number): number[] {
  if (total <= 9) {
    return Array.from({ length: total }, (_, idx) => idx + 1)
  }

  const set = new Set<number>()
  set.add(1)
  set.add(total)
  for (let offset = -2; offset <= 2; offset++) {
    const p = current + offset
    if (p >= 1 && p <= total) set.add(p)
  }

  return [...set].sort((a, b) => a - b)
}

export function getBlogPaginationPageNumbers(
  currentPage: number,
  totalPages: number,
): number[] {
  return getBlogVisiblePageNums(
    Math.min(Math.max(1, currentPage), Math.max(1, totalPages)),
    Math.max(1, totalPages),
  )
}

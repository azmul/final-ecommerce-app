type SearchParams = { [key: string]: string | string[] | undefined }

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export function parseOptionalPrice(raw: string | undefined | null): number | undefined {
  if (raw == null || !raw.trim()) return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function parseOptionalSort(raw: string | undefined | null): string | undefined {
  const trimmed = raw?.trim()
  return trimmed || undefined
}

export type ShopGridViewParam = 'comfortable' | 'compact' | undefined

export function parseShopView(raw: string | undefined | null): ShopGridViewParam {
  const trimmed = raw?.trim()
  return trimmed === 'compact' || trimmed === 'comfortable' ? trimmed : undefined
}

/** User-applied shop filters (excludes category path context). */
export function shopHasUserFilters(input: {
  badge?: string
  brandSlug?: string
  inStockOnly?: boolean
  maxPrice?: number
  minPrice?: number
  searchValue?: string
  sort?: string
  subcategorySlug?: string
  variantOptionIds?: number[]
}): boolean {
  return Boolean(
    input.searchValue?.trim() ||
      input.subcategorySlug ||
      input.brandSlug ||
      input.badge ||
      input.inStockOnly ||
      input.minPrice != null ||
      input.maxPrice != null ||
      input.sort ||
      (input.variantOptionIds?.length ?? 0) > 0,
  )
}

export function parseShopSearchParams(resolved: SearchParams) {
  const searchValue = firstString(resolved.q)?.trim() || undefined
  const sort = parseOptionalSort(firstString(resolved.sort))
  const brandSlug = firstString(resolved.brand)?.trim() || undefined
  const badge = firstString(resolved.badge)?.trim() || undefined
  const subcategorySlug = firstString(resolved.sub)?.trim() || undefined
  const inStockOnly = firstString(resolved.inStock) === '1'
  const view = parseShopView(firstString(resolved.view))
  const minPrice = parseOptionalPrice(firstString(resolved.minPrice))
  const maxPrice = parseOptionalPrice(firstString(resolved.maxPrice))
  const variantOptionIds = (firstString(resolved.vopt) ?? '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)

  return {
    badge,
    brandSlug,
    inStockOnly,
    maxPrice,
    minPrice,
    searchValue,
    sort,
    subcategorySlug,
    variantOptionIds,
    view,
  }
}

/** True when URL contains filter-like query keys, including invalid values the user can clear. */
export function shopUrlHasFilterParams(searchParams: URLSearchParams): boolean {
  const filterKeys = ['q', 'brand', 'badge', 'inStock', 'minPrice', 'maxPrice', 'sort', 'sub', 'vopt']
  return filterKeys.some((key) => searchParams.has(key))
}

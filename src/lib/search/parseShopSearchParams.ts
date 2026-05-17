type SearchParams = { [key: string]: string | string[] | undefined }

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export function parseShopSearchParams(resolved: SearchParams) {
  const searchValue = firstString(resolved.q)?.trim() || undefined
  const sort = firstString(resolved.sort)
  const brandSlug = firstString(resolved.brand)?.trim() || undefined
  const subcategorySlug = firstString(resolved.sub)?.trim() || undefined
  const inStockOnly = firstString(resolved.inStock) === '1'

  const minRaw = firstString(resolved.minPrice)
  const maxRaw = firstString(resolved.maxPrice)
  const minPrice =
    minRaw && Number.isFinite(Number(minRaw)) ? Number(minRaw) : undefined
  const maxPrice =
    maxRaw && Number.isFinite(Number(maxRaw)) ? Number(maxRaw) : undefined

  return {
    brandSlug,
    inStockOnly,
    maxPrice,
    minPrice,
    searchValue,
    sort,
    subcategorySlug,
  }
}

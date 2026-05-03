/** Base path for the catalog (all products). */
export const SHOP_BASE_PATH = '/shop'

/** `/shop/:slug` category URLs use a single path segment after `/shop`. */
export function getCategorySlugFromShopPath(pathname: string): string | null {
  if (pathname === SHOP_BASE_PATH) return null
  if (!pathname.startsWith(`${SHOP_BASE_PATH}/`)) return null
  const segment = pathname.slice(SHOP_BASE_PATH.length + 1)
  if (!segment || segment.includes('/')) return null
  return segment
}

export function isShopCategoryPath(pathname: string): boolean {
  return getCategorySlugFromShopPath(pathname) !== null
}

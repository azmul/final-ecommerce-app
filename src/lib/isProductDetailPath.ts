/** True for storefront product detail URLs like `/products/my-item`. */
export function isProductDetailPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false

  const parts = pathname.split('/').filter(Boolean)
  return parts[0] === 'products' && parts.length >= 2
}

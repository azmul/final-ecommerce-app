import { extractProductAttributes } from '@/lib/ai/productDocument'
import type { AiProductResult } from '@/lib/ai/types'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'
import type { Media, Product, Variant } from '@/payload-types'

export function getEffectivePrice(product: Product, variants: Variant[] = []): number | null {
  if (!product.enableVariants) {
    return typeof product.priceInBDT === 'number' ? product.priceInBDT : null
  }

  const prices = variants
    .map((variant) => variant.priceInBDT)
    .filter((price): price is number => typeof price === 'number')

  if (!prices.length) {
    return typeof product.priceInBDT === 'number' ? product.priceInBDT : null
  }

  return Math.min(...prices)
}

export function getDefaultVariantId(variants: Variant[] = []): number | null {
  const inStock = variants.find((variant) => (variant.inventory ?? 0) > 0)
  if (inStock) return inStock.id
  return variants[0]?.id ?? null
}

export function getProductImageUrl(product: Product): string | null {
  const image = product.gallery?.[0]?.image
  if (!image || typeof image !== 'object') return null
  const media = image as Media
  const url = typeof media.url === 'string' ? media.url : null
  return url ? (toAbsoluteUrl(url) ?? null) : null
}

export function getSalePrice(listPrice: number | null, discountPercentage: number | null): number | null {
  if (listPrice === null) return null
  const pct =
    typeof discountPercentage === 'number' && Number.isFinite(discountPercentage)
      ? Math.min(Math.max(Math.round(discountPercentage), 0), 100)
      : 0
  if (!pct) return listPrice
  return Math.round(listPrice * (100 - pct)) / 100
}

export function isProductInStock(product: Product, variants: Variant[] = []): boolean {
  if (!product.enableVariants) {
    return (product.inventory ?? 0) > 0
  }

  if (!variants.length) return false
  return variants.some((variant) => (variant.inventory ?? 0) > 0)
}

export function formatAiProduct(args: {
  product: Product
  variants?: Variant[]
  relevanceScore?: number
  whyItMatches?: string
}): AiProductResult {
  const variants = args.variants ?? []
  const attrs = extractProductAttributes(args.product, variants)
  const baseUrl = getServerSideURL()
  const listPrice = getEffectivePrice(args.product, variants)
  const enableVariants = Boolean(args.product.enableVariants)

  return {
    brand: attrs.brand,
    categories: attrs.categories,
    colors: attrs.colors,
    discountPercentage: args.product.discountPercentage ?? null,
    enableVariants,
    id: args.product.id,
    imageUrl: getProductImageUrl(args.product),
    inStock: isProductInStock(args.product, variants),
    materials: attrs.materials,
    price: listPrice,
    rating: args.product.reviewAverageRating ?? null,
    relevanceScore: args.relevanceScore,
    reviewCount: args.product.reviewCount ?? null,
    salePrice: getSalePrice(listPrice, args.product.discountPercentage ?? null),
    sizes: attrs.sizes,
    slug: args.product.slug,
    title: args.product.title,
    url: `${baseUrl}/products/${args.product.slug}`,
    variantId: enableVariants ? getDefaultVariantId(variants) : null,
    whyItMatches: args.whyItMatches,
  }
}

export function rankAiProducts(products: AiProductResult[]): AiProductResult[] {
  return [...products].sort((a, b) => {
    const scoreA = a.relevanceScore ?? 0
    const scoreB = b.relevanceScore ?? 0
    if (scoreB !== scoreA) return scoreB - scoreA
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1
    const ratingA = a.rating ?? 0
    const ratingB = b.rating ?? 0
    if (ratingB !== ratingA) return ratingB - ratingA
    const reviewsA = a.reviewCount ?? 0
    const reviewsB = b.reviewCount ?? 0
    return reviewsB - reviewsA
  })
}

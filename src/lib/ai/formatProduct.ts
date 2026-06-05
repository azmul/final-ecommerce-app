import { extractProductAttributes } from '@/lib/ai/productDocument'
import type { AiProductResult } from '@/lib/ai/types'
import { resolveProductPricing } from '@/lib/ecommerce/resolveProductPricing'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'
import type { Media, Product, Variant, VariantOption } from '@/payload-types'

/** Lowest list price — used for search scoring and price filters. */
export function getEffectivePrice(product: Product, variants: Variant[] = []): number | null {
  return resolveProductPricing(product, variants).listLow
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

export function isProductInStock(product: Product, variants: Variant[] = []): boolean {
  if (!product.enableVariants) {
    return (product.inventory ?? 0) > 0
  }

  if (!variants.length) return false
  return variants.some((variant) => (variant.inventory ?? 0) > 0)
}

function getVariantLabel(variant: Variant): string {
  const optionLabels = (variant.options ?? [])
    .map((option) => {
      if (!option || typeof option !== 'object') return null
      const opt = option as VariantOption
      if (typeof opt.label !== 'string') return null
      if (typeof opt.value === 'string' && opt.value.trim().length) {
        return `${opt.label}: ${opt.value}`
      }
      return opt.label
    })
    .filter((value): value is string => Boolean(value))

  if (optionLabels.length) {
    return optionLabels.join(' · ')
  }

  return `Variant #${variant.id}`
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
  const pricing = resolveProductPricing(args.product, variants)
  const enableVariants = Boolean(args.product.enableVariants)
  const discountFromField =
    typeof args.product.discountPercentage === 'number' ? Math.round(args.product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const variantsSummary = variants
    .filter((variant) => (variant.inventory ?? 0) > 0)
    .slice(0, 5)
    .map((variant) => {
      const price = typeof variant.priceInBDT === 'number' ? variant.priceInBDT : null
      return {
        id: variant.id,
        inStock: (variant.inventory ?? 0) > 0,
        label: getVariantLabel(variant),
        price,
        salePrice:
          price != null && discountPercent > 0 ?
            Math.round(price * (100 - discountPercent)) / 100
          : price,
      }
    })

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
    price: pricing.listLow,
    priceHigh: pricing.isRange ? pricing.listHigh : pricing.listLow,
    rating: args.product.reviewAverageRating ?? null,
    relevanceScore: args.relevanceScore,
    reviewCount: args.product.reviewCount ?? null,
    salePrice: pricing.saleLow,
    salePriceHigh: pricing.isRange ? pricing.saleHigh : pricing.saleLow,
    sizes: attrs.sizes,
    slug: args.product.slug,
    title: args.product.title,
    url: `${baseUrl}/products/${args.product.slug}`,
    variantId: enableVariants ? getDefaultVariantId(variants) : null,
    variantsSummary: variantsSummary.length ? variantsSummary : undefined,
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

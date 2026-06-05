export type ProductSearchFilters = {
  query?: string
  category?: string
  brand?: string
  color?: string
  size?: string
  material?: string
  gender?: string
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  limit?: number
}

export type AiProductResult = {
  variantsSummary?: {
    id: number
    label: string
    inStock: boolean
    price: number | null
    salePrice: number | null
  }[]
  id: number
  title: string
  slug: string
  /** List price (low end for variant ranges). */
  price: number | null
  /** List price high end when variants differ; otherwise same as `price`. */
  priceHigh?: number | null
  /** Discounted price (low end for variant ranges). */
  salePrice: number | null
  /** Discounted high end when variants differ; otherwise same as `salePrice`. */
  salePriceHigh?: number | null
  discountPercentage: number | null
  inStock: boolean
  enableVariants: boolean
  variantId: number | null
  imageUrl: string | null
  brand: string | null
  categories: string[]
  colors: string[]
  sizes: string[]
  materials: string[]
  rating: number | null
  reviewCount: number | null
  url: string
  whyItMatches?: string
  relevanceScore?: number
}

export type ProductSearchResponse = {
  products: AiProductResult[]
  total: number
  filtersApplied: ProductSearchFilters
  relaxedFilters?: string[]
}

export type SemanticSearchRequest = {
  query: string
  limit?: number
}

export type SemanticSearchResponse = {
  products: AiProductResult[]
  total: number
  method: 'vector' | 'text'
}

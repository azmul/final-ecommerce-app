import { ShopActiveFiltersBar, ShopSortBy } from '@/components/ShopClearFilters'
import { ScrollShopProductsOnPathChange } from '@/components/shop/ScrollShopProductsOnPathChange'
import { ShopProductsInfiniteGrid } from '@/components/shop/ShopProductsInfiniteGrid.client'
import {
  ShopProductFilters,
  type ShopBrandOption,
} from '@/components/shop/ShopProductFilters'
import {
  ShopSubcategoryFilters,
  type ShopSubcategoryLite,
} from '@/components/shop/ShopSubcategoryFilters'
import { TaxonomyGeoSection } from '@/components/seo/TaxonomyGeoSection'
import { buildBreadcrumbJsonLd } from '@/lib/seo/buildBreadcrumbJsonLd'
import { buildCollectionPageJsonLd } from '@/lib/seo/buildCollectionPageJsonLd'
import { JsonLd } from '@/lib/seo/JsonLd'
import { ProductListingJsonLd } from '@/lib/seo/productListingJsonLd'
import { buildFaqJsonLd, getTaxonomySeoContent, parseFaqs } from '@/lib/seo/resolveGeoContent'
import {
  buildShopListingKey,
  fetchShopProducts,
  SHOP_PRODUCTS_PER_PAGE,
  type ShopListingFilters,
} from '@/lib/search/shopProducts'
import { getServerSideURL } from '@/utilities/getURL'
import type { Product } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LayoutGrid, PackageSearch } from 'lucide-react'
import React, { Suspense } from 'react'

export type ShopPageViewProps = {
  brandSlug?: string
  categoryId?: string
  categorySlug?: string
  inStockOnly?: boolean
  maxPrice?: number
  minPrice?: number
  searchValue?: string
  /** Query param `sub` — subcategory slug, scoped to categorySlug */
  subcategorySlug?: string
  sort?: string
}

export async function ShopPageView({
  brandSlug,
  categoryId,
  categorySlug,
  inStockOnly,
  maxPrice,
  minPrice,
  searchValue,
  subcategorySlug,
  sort,
}: ShopPageViewProps) {
  const payload = await getPayload({ config: configPromise })

  let categoryTitle: string | undefined
  let categorySeoContent: ReturnType<typeof getTaxonomySeoContent> = null
  if (categoryId) {
    try {
      const doc = await payload.findByID({
        collection: 'categories',
        id: categoryId,
      })
      categoryTitle = typeof doc?.title === 'string' ? doc.title : undefined
      categorySeoContent = getTaxonomySeoContent(doc)
    } catch {
      categoryTitle = undefined
      categorySeoContent = null
    }
  }

  let subcategoryId: string | undefined
  let subcategoryTitle: string | undefined
  if (categoryId && subcategorySlug) {
    const subFound = await payload.find({
      collection: 'subcategories',
      limit: 1,
      overrideAccess: false,
      where: {
        and: [{ slug: { equals: subcategorySlug } }, { parent: { equals: categoryId } }],
      },
    })
    const subDoc = subFound.docs[0]
    if (subDoc && typeof subDoc.id !== 'undefined') {
      subcategoryId = String(subDoc.id)
      subcategoryTitle = typeof subDoc.title === 'string' ? subDoc.title : undefined
    }
  }

  let brandId: string | undefined
  let brandTitle: string | undefined
  if (brandSlug) {
    const brandFound = await payload.find({
      collection: 'brands',
      limit: 1,
      overrideAccess: false,
      where: { slug: { equals: brandSlug } },
    })
    const brandDoc = brandFound.docs[0]
    if (brandDoc) {
      brandId = String(brandDoc.id)
      brandTitle = typeof brandDoc.title === 'string' ? brandDoc.title : undefined
    }
  }

  const brandsResponse = await payload.find({
    collection: 'brands',
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: { slug: true, title: true },
    sort: 'title',
  })
  const brandOptions: ShopBrandOption[] = brandsResponse.docs
    .filter((b) => typeof b.slug === 'string' && b.slug)
    .map((b) => ({
      id: b.id,
      slug: b.slug as string,
      title: typeof b.title === 'string' ? b.title : '',
    }))

  let subcategoriesForFilters: ShopSubcategoryLite[] = []
  if (categoryId && categorySlug) {
    const subsResponse = await payload.find({
      collection: 'subcategories',
      limit: 500,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
        title: true,
      },
      sort: 'title',
      where: {
        parent: {
          equals: categoryId,
        },
      },
    })
    subcategoriesForFilters = subsResponse.docs.map((doc) => ({
      id: doc.id,
      title: typeof doc.title === 'string' ? doc.title : '',
      slug: typeof doc.slug === 'string' ? doc.slug : null,
    }))
  }

  const listingFilters: ShopListingFilters = {
    brandId,
    categoryId,
    categorySlug,
    inStockOnly,
    maxPrice,
    minPrice,
    searchValue,
    sort,
    subcategoryId,
  }

  const products = await fetchShopProducts(payload, {
    ...listingFilters,
    page: 1,
    limit: SHOP_PRODUCTS_PER_PAGE,
  })

  const listingKey = buildShopListingKey(listingFilters)

  const count = products.totalDocs
  const resultsWord = count === 1 ? 'product' : 'products'
  const hasActiveFilters = Boolean(
    searchValue || categoryId || subcategoryId || brandSlug || inStockOnly || minPrice != null || maxPrice != null,
  )
  const showEmpty = count === 0

  const pageTitle = (() => {
    if (searchValue) {
      return `Results for “${searchValue}”`
    }
    if (subcategoryTitle) {
      return subcategoryTitle
    }
    if (categoryTitle) {
      return categoryTitle
    }
    if (brandTitle) {
      return brandTitle
    }
    return 'All products'
  })()

  const listingPath =
    categorySlug ? `/shop/${categorySlug}`
    : brandSlug ? `/brand/${brandSlug}`
    : '/shop'

  const base = getServerSideURL()
  const listingUrl = `${base}${listingPath}`
  const listingDescription = `${pageTitle} — browse ${count} products online in Bangladesh.`

  const breadcrumbItems = [
    { name: 'Home', item: `${base}/` },
    { name: 'Shop', item: `${base}/shop` },
    ...(categorySlug && categoryTitle ?
      [{ name: categoryTitle, item: `${base}/shop/${categorySlug}` }]
    : []),
  ]

  const categoryFaqs = categorySeoContent ? parseFaqs(categorySeoContent.faqs) : []
  const faqLd =
    categoryFaqs.length > 0 && categorySlug ?
      buildFaqJsonLd(`${base}/shop/${categorySlug}`, categoryFaqs)
    : null

  const jsonLdGraphs = [
    buildBreadcrumbJsonLd(breadcrumbItems),
    buildCollectionPageJsonLd({
      name: pageTitle,
      description: categorySeoContent?.aiSummary?.trim() || listingDescription,
      url: listingUrl,
    }),
    ...(faqLd ? [faqLd] : []),
  ]

  return (
    <>
      <JsonLd data={jsonLdGraphs} />
      {!hasActiveFilters && count > 0 ?
        <ProductListingJsonLd
          description={listingDescription}
          name={pageTitle}
          pageUrl={listingPath}
          products={products.docs as Product[]}
        />
      : null}
      <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:pb-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {showEmpty && !hasActiveFilters
              ? 'No products are listed yet.'
              : showEmpty && hasActiveFilters
                ? 'Try adjusting search or filters.'
                : `${count} ${resultsWord} ${hasActiveFilters ? 'match your filters' : 'available'}`}
          </p>
        </div>
        <div className="shrink-0">
          <ShopSortBy />
        </div>
      </div>

      <Suspense fallback={null}>
        <ShopProductFilters brands={brandOptions} />
      </Suspense>

      {categoryTitle && categorySeoContent && !hasActiveFilters ?
        <TaxonomyGeoSection seoContent={categorySeoContent} title={categoryTitle} />
      : null}

      <ShopActiveFiltersBar hasChips={hasActiveFilters}>
        {searchValue ? (
          <span className="inline-flex max-w-full items-center truncate rounded-full border border-border bg-background px-3 py-1 font-medium text-foreground">
            Search &quot;{searchValue}&quot;
          </span>
        ) : null}
        {brandTitle ? (
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 font-medium text-foreground">
            {brandTitle}
          </span>
        ) : null}
        {categoryTitle ? (
          <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-medium text-primary">
            {categoryTitle}
          </span>
        ) : categoryId && !categoryTitle ? (
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 font-medium text-muted-foreground">
            Category filter
          </span>
        ) : null}
        {subcategoryTitle ? (
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 font-medium text-foreground">
            {subcategoryTitle}
          </span>
        ) : null}
        {inStockOnly ? (
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 font-medium text-foreground">
            In stock
          </span>
        ) : null}
        {minPrice != null ? (
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 font-medium text-foreground">
            Min ৳{minPrice}
          </span>
        ) : null}
        {maxPrice != null ? (
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 font-medium text-foreground">
            Max ৳{maxPrice}
          </span>
        ) : null}
      </ShopActiveFiltersBar>

      <div
        id="shop-products"
        className="scroll-mt-20 space-y-6 sm:scroll-mt-24 sm:space-y-8"
      >
        <ScrollShopProductsOnPathChange />
        {categorySlug ? (
          <Suspense fallback={null}>
            <ShopSubcategoryFilters
              categorySlug={categorySlug}
              subcategories={subcategoriesForFilters}
            />
          </Suspense>
        ) : null}

        {showEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center sm:py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              {hasActiveFilters ? (
                <PackageSearch className="h-7 w-7 text-muted-foreground" aria-hidden />
              ) : (
                <LayoutGrid className="h-7 w-7 text-muted-foreground" aria-hidden />
              )}
            </div>
            <p className="mt-4 max-w-md text-lg font-medium text-foreground">
              {hasActiveFilters ? 'No matches yet' : 'Nothing to show here'}
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'Use Clear filters above to reset search, category, and sort.'
                : 'New items will appear here once they are published in the catalog.'}
            </p>
          </div>
        ) : (
          <ShopProductsInfiniteGrid
            filters={listingFilters}
            initialHasMore={products.hasNextPage}
            initialProducts={products.docs as Product[]}
            listingKey={listingKey}
          />
        )}
      </div>
    </div>
    </>
  )
}

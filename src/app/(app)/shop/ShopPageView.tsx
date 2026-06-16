import { ShopSearchBeacon } from '@/components/analytics/ShopSearchBeacon'
import { ScrollShopProductsOnPathChange } from '@/components/shop/ScrollShopProductsOnPathChange'
import { LcpImagePreload, PreconnectHint } from '@/components/ResourceHints'
import { ShopProductsInfiniteGrid } from '@/components/shop/ShopProductsInfiniteGrid.client'
import { ShopBreadcrumb } from '@/components/shop/ShopBreadcrumb'
import { ShopFilterPanel } from '@/components/shop/ShopFilterPanel'
import { ShopListingToolbar } from '@/components/shop/ShopListingToolbar'
import { ProductRecommendationsCarousel } from '@/components/product/ProductRecommendationsCarousel'
import { TaxonomyGeoSection } from '@/components/seo/TaxonomyGeoSection'
import { buildBreadcrumbJsonLd } from '@/lib/seo/buildBreadcrumbJsonLd'
import { buildCollectionPageJsonLd } from '@/lib/seo/buildCollectionPageJsonLd'
import { JsonLd } from '@/lib/seo/JsonLd'
import { ProductListingJsonLd } from '@/lib/seo/productListingJsonLd'
import { buildFaqJsonLd, getTaxonomySeoContent, parseFaqs } from '@/lib/seo/resolveGeoContent'
import { shopHasUserFilters } from '@/lib/search/parseShopSearchParams'
import { fetchShopFilterFacets } from '@/lib/search/shopFilterFacets'
import {
  buildShopListingKey,
  fetchShopProducts,
  SHOP_PRODUCTS_PER_PAGE,
  type ShopListingFilters,
} from '@/lib/search/shopProducts'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'
import type { Product } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LayoutGrid, PackageSearch } from 'lucide-react'
import React, { Suspense } from 'react'

export type ShopPageViewProps = {
  badge?: string
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
  variantOptionIds?: number[]
  view?: 'comfortable' | 'compact' | 'default'
}

export async function ShopPageView({
  badge,
  brandSlug,
  categoryId,
  categorySlug,
  inStockOnly,
  maxPrice,
  minPrice,
  searchValue,
  subcategorySlug,
  sort,
  variantOptionIds,
  view,
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

  const filterFacets = await fetchShopFilterFacets(payload, {
    categoryId,
  })

  const listingFilters: ShopListingFilters = {
    badge,
    brandId,
    categoryId,
    categorySlug,
    inStockOnly,
    maxPrice,
    minPrice,
    searchValue,
    sort,
    subcategoryId,
    variantOptionIds,
    view,
  }

  const products = await fetchShopProducts(payload, {
    ...listingFilters,
    page: 1,
    limit: SHOP_PRODUCTS_PER_PAGE,
  })

  const listingKey = buildShopListingKey(listingFilters)

  const count = products.totalDocs
  const resultsWord = count === 1 ? 'product' : 'products'
  const hasActiveFilters = shopHasUserFilters({
    badge,
    brandSlug: brandId ? brandSlug : undefined,
    inStockOnly,
    maxPrice,
    minPrice,
    searchValue,
    sort,
    subcategorySlug: subcategoryId ? subcategorySlug : undefined,
    variantOptionIds,
  })

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

  const firstProduct = products.docs[0] as Product | undefined
  const firstGalleryImage =
    firstProduct?.gallery?.[0]?.image && typeof firstProduct.gallery[0].image === 'object'
      ? firstProduct.gallery[0].image
      : undefined
  const shopLcpImageUrl =
    firstGalleryImage?.url ?
      toAbsoluteUrl(firstGalleryImage.url) ?? `${getServerSideURL()}${firstGalleryImage.url}`
    : undefined

  return (
    <>
      <ShopSearchBeacon searchValue={searchValue} />
      <LcpImagePreload href={shopLcpImageUrl} />
      <PreconnectHint href={shopLcpImageUrl} />
      <JsonLd data={jsonLdGraphs} />
      {!hasActiveFilters && count > 0 ?
        <ProductListingJsonLd
          description={listingDescription}
          name={pageTitle}
          pageUrl={listingPath}
          products={products.docs as Product[]}
        />
      : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
        <aside className="hidden w-full shrink-0 lg:block lg:w-72 xl:w-80">
          <Suspense fallback={null}>
            <ShopFilterPanel
              badges={filterFacets.badges}
              brands={filterFacets.brands}
              categories={filterFacets.categories}
              categorySlug={categorySlug}
              className="sticky top-24"
              priceBounds={filterFacets.priceBounds}
              subcategories={filterFacets.subcategories}
              variantOptions={filterFacets.variantOptions}
            />
          </Suspense>
        </aside>

        <div className="min-w-0 flex-1 space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {pageTitle}
            </h1>
            <ShopBreadcrumb categoryTitle={categoryTitle} />
          </div>

          <Suspense fallback={null}>
            <ShopListingToolbar
              badges={filterFacets.badges}
              brands={filterFacets.brands}
              categories={filterFacets.categories}
              categorySlug={categorySlug}
              priceBounds={filterFacets.priceBounds}
              subcategories={filterFacets.subcategories}
            />
          </Suspense>

          {categoryTitle && categorySeoContent && !hasActiveFilters ?
            <TaxonomyGeoSection seoContent={categorySeoContent} title={categoryTitle} />
          : null}

          {!showEmpty && !hasActiveFilters ?
            <p className="text-sm text-muted-foreground">
              {count} {resultsWord} available
            </p>
          : null}

          <div
            id="shop-products"
            className="scroll-mt-20 space-y-6 sm:scroll-mt-24 sm:space-y-8"
          >
            <ScrollShopProductsOnPathChange />

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
                    ? 'Use Clear All Filters to reset search and filters.'
                    : 'New items will appear here once they are published in the catalog.'}
                </p>
              </div>
            ) : (
              <ShopProductsInfiniteGrid
                filters={listingFilters}
                initialHasMore={products.hasNextPage}
                initialProducts={products.docs as Product[]}
                listingKey={listingKey}
                view={view}
              />
            )}
          </div>

          {!hasActiveFilters ?
            <ProductRecommendationsCarousel context="homepage" heading="Popular picks for you" />
          : null}
        </div>
      </div>
    </>
  )
}

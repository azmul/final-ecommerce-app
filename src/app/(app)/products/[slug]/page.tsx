import type { Media, Product } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LcpImagePreload, PreconnectHint } from '@/components/ResourceHints'
import { GridTileImage } from '@/components/Grid/tile'
import { Gallery } from '@/components/product/Gallery'
import { ProductOverviewDetails, ProductTitleBlock } from '@/components/product/ProductOverview'
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel'
import { ProductBreadcrumb } from '@/components/product/ProductBreadcrumb'
import { ProductOverviewHeroTeaser } from '@/components/product/ProductOverviewHeroTeaser'
import { ProductDetailsTabContent } from '@/components/product/ProductDetailsTabContent'
import { StripShopParamsFromProductUrl } from '@/components/product/StripShopParamsFromProductUrl'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Metadata } from 'next'
import { ProductViewBeacon } from '@/components/analytics/ProductViewBeacon'
import { ProductDetailTabs } from '@/components/product/ProductDetailTabs'
import { ProductMobileBuyBar } from '@/components/product/ProductMobileBuyBar'
import { productHasDescriptionOrSpecs, productHasGeoContent } from '@/components/product/ProductGeoSection'
import { ProductFlashSaleCountdown } from '@/components/product/ProductFlashSaleCountdown'
import { ProductSizeGuide } from '@/components/product/ProductSizeGuide'
import { galleryHasRenderableSlides } from '@/utilities/galleryMedia'
import { extractLcpImageUrlFromProduct } from '@/lib/seo/extractLcpImageUrl'
import { JsonLd } from '@/lib/seo/JsonLd'
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  type ProductReviewForJsonLd,
} from '@/lib/seo/buildProductJsonLd'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'
import { sanitizeProductSeoText } from '@/lib/seo/sanitizeProductSeoText'
import dynamic from 'next/dynamic'

const ProductArViewer = dynamic(() =>
  import('@/components/product/ProductArViewer').then((mod) => ({ default: mod.ProductArViewer })),
)

const ProductBundleOffers = dynamic(() =>
  import('@/components/product/ProductBundleOffers').then((mod) => ({
    default: mod.ProductBundleOffers,
  })),
)

const FrequentlyBoughtTogether = dynamic(() =>
  import('@/components/product/FrequentlyBoughtTogether').then((mod) => ({
    default: mod.FrequentlyBoughtTogether,
  })),
)

const ProductRecommendationsCarousel = dynamic(() =>
  import('@/components/product/ProductRecommendationsCarousel').then((mod) => ({
    default: mod.ProductRecommendationsCarousel,
  })),
)

const RecentlyViewedCarousel = dynamic(() =>
  import('@/components/product/RecentlyViewedCarousel').then((mod) => ({
    default: mod.RecentlyViewedCarousel,
  })),
)

const SimilarProductsCarousel = dynamic(() =>
  import('@/components/product/SimilarProductsCarousel').then((mod) => ({
    default: mod.SimilarProductsCarousel,
  })),
)

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const canIndex = product._status === 'published'

  const seoImage = metaImage || (gallery.length ? (gallery[0]?.image as Media) : undefined)
  const base = getServerSideURL()
  const path = `/products/${slug}`
  const canonicalUrl = `${base}${path}`

  const ogImageUrl = seoImage?.url ? toAbsoluteUrl(seoImage.url) : undefined

  const seoContent = (product as Product & { seoContent?: { aiSummary?: string | null } }).seoContent
  const title = product.meta?.title || product.title
  const description =
    sanitizeProductSeoText(seoContent?.aiSummary) ||
    product.meta?.description?.trim() ||
    (typeof product.title === 'string' ?
      `Shop ${product.title} online in Bangladesh — fast checkout and nationwide delivery.`
    : '')

  return {
    alternates: { canonical: canonicalUrl },
    description,
    other: {
      'ai-summary': description,
      'og:type': 'product',
    },
    openGraph: mergeOpenGraph({
      description,
      images: ogImageUrl
        ? [
            {
              alt: seoImage?.alt || title,
              height: seoImage?.height ?? undefined,
              url: ogImageUrl,
              width: seoImage?.width ?? undefined,
            },
          ]
        : undefined,
      title,
      url: canonicalUrl,
    }),
    robots: {
      follow: canIndex,
      googleBot: {
        follow: canIndex,
        index: canIndex,
      },
      index: canIndex,
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
      title,
    },
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery = product.gallery ?? []

  const relatedProducts =
    product.relatedProducts?.filter((relatedProduct) => typeof relatedProduct === 'object') ?? []

  const reviews = await queryApprovedReviews(product.id)

  const jsonLdGraphs = [
    ...buildProductJsonLd(product, slug, reviews),
    buildProductBreadcrumbJsonLd(product, slug),
  ]

  const hasGeoContent = productHasGeoContent(product)
  const hasDetailsTab = hasGeoContent || productHasDescriptionOrSpecs(product)
  const lcpImageUrl = extractLcpImageUrlFromProduct(product)

  return (
    <React.Fragment>
      <LcpImagePreload href={lcpImageUrl} />
      <PreconnectHint href={lcpImageUrl} />
      <ProductViewBeacon productId={product.id} />
      <Suspense fallback={null}>
        <StripShopParamsFromProductUrl />
      </Suspense>
      <JsonLd data={jsonLdGraphs} />
      <div
        className={cn(
          cmsPageGutterClassName,
          'relative overflow-x-hidden pt-3 pb-32 sm:pb-28 sm:pt-6 lg:pb-14 lg:pt-8',
        )}
      >
        <div className="relative mx-auto w-full min-w-0 max-w-6xl space-y-8 sm:space-y-12 lg:space-y-14">
          <section aria-label="Product overview" className="flex flex-col gap-4 sm:gap-5">
            <ProductBreadcrumb product={product} />

            <div className="w-full min-w-0">
              <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[minmax(0,540px)_minmax(0,1fr)] xl:gap-x-16">
                <div className="-mx-6 min-h-0 min-w-0 sm:-mx-10 lg:mx-0 lg:sticky lg:top-28">
                  <Suspense
                    fallback={
                      <div className="aspect-[4/5] w-full animate-pulse bg-linear-to-br from-muted/50 via-muted/30 to-muted/60 sm:aspect-square sm:rounded-3xl" />
                    }
                  >
                    {galleryHasRenderableSlides(gallery) && (
                      <Gallery gallery={gallery} mobileFullBleed />
                    )}
                  </Suspense>
                </div>

                <div className="flex min-w-0 flex-col gap-5 px-0 sm:gap-6">
                  <ProductTitleBlock product={product} />
                  <ProductFlashSaleCountdown product={product} />
                  <ProductPurchasePanel product={product} />
                  {!hasDetailsTab ?
                    <ProductOverviewDetails product={product} />
                  : hasGeoContent ?
                    <ProductOverviewHeroTeaser product={product} />
                  : null}
                </div>
              </div>
            </div>
          </section>

          <ProductMobileBuyBar product={product} />

          {product.layout?.length ? <RenderBlocks blocks={product.layout} /> : null}

          <Suspense fallback={null}>
            <ProductBundleOffers productId={product.id} />
            <ProductSizeGuide product={product} />
            <ProductArViewer product={product} />
          </Suspense>

          <ProductDetailTabs
            details={hasDetailsTab ? <ProductDetailsTabContent product={product} /> : null}
            product={product}
            productId={product.id}
            reviewAverage={product.reviewAverageRating ?? null}
            reviewCount={product.reviewCount ?? null}
            reviewSummary={
              (product as Product & {
                reviewSummary?: {
                  commonComplaints?: { item?: string | null }[] | null
                  cons?: { item?: string | null }[] | null
                  pros?: { item?: string | null }[] | null
                  sentiment?: number | null
                  text?: string | null
                } | null
              }).reviewSummary ?? null
            }
            showDetails={hasDetailsTab}
          />

          <Suspense fallback={null}>
            <SimilarProductsCarousel productId={product.id} />
            <FrequentlyBoughtTogether productId={product.id} />
            <ProductRecommendationsCarousel context="pdp" productId={product.id} />
            <RecentlyViewedCarousel excludeProductId={product.id} />
          </Suspense>

          {relatedProducts.length ? (
            <RelatedProducts products={relatedProducts as Product[]} />
          ) : null}
        </div>
      </div>
    </React.Fragment>
  )
}

function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null

  return (
    <section
      aria-labelledby="related-products-heading"
      className="w-full min-w-0 rounded-2xl border border-border/70 p-4 sm:p-6 md:p-8 lg:p-10 dark:border-border"
    >
      <header className="mb-6 space-y-3 sm:mb-8 md:mb-10">
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/9 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground dark:border-primary/30 dark:bg-primary/12">
          <Sparkles className="size-3.5 shrink-0 opacity-90" aria-hidden />
          Curated for you
        </p>
        <div className="space-y-2">
          <h2
            className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            id="related-products-heading"
          >
            You may also like
          </h2>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Explore more from the catalog—each opens the full product page with gallery and details.
          </p>
        </div>
      </header>

      <ul className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 pt-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] touch-pan-x sm:gap-5 md:grid md:snap-none md:touch-auto md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 lg:grid-cols-4">
        {products.map((product) => {
          let price = product.priceInBDT

          if (product.enableVariants && product.variants?.docs?.length) {
            const variant = product.variants.docs[0]
            if (variant && typeof variant === 'object' && typeof variant.priceInBDT === 'number') {
              price = variant.priceInBDT
            }
          }

          const media = product.meta?.image as Media

          return (
            <li
              className="aspect-square min-w-[10.75rem] w-[clamp(11rem,min(74vw,14rem),16rem)] max-w-[100%] flex-none snap-start sm:min-w-0 sm:w-56 md:min-h-0 md:w-auto"
              key={product.id}
            >
              <Link
                className={cn(
                  'group/card relative flex min-h-[11.25rem] h-full min-w-0 w-full touch-manipulation flex-col rounded-2xl border border-border/85 bg-background/85 p-2 shadow-md shadow-black/5 outline-none ring-offset-background transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/14 active:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/9 dark:bg-background/55 dark:shadow-black/45 dark:hover:border-primary/45 dark:hover:shadow-primary/8 sm:min-h-0',
                )}
                href={`/products/${product.slug}`}
              >
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
                  <GridTileImage
                    accent="brand"
                    borderless
                    label={
                      typeof price === 'number'
                        ? {
                            amount: price,
                            title: product.title,
                          }
                        : undefined
                    }
                    media={media}
                  />
                  <span
                    className="pointer-events-none absolute right-2 top-2 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/95 text-muted-foreground opacity-0 shadow-sm backdrop-blur-md transition-all duration-300 group-hover/card:opacity-100 group-hover/card:border-primary/35 group-hover/card:text-primary dark:bg-background/90"
                    aria-hidden
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-linear-to-t from-black/25 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 dark:from-black/40" />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Most recent approved reviews, server-rendered into Product JSON-LD for review rich results. */
const queryApprovedReviews = async (productId: number): Promise<ProductReviewForJsonLd[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'product-reviews',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: '-createdAt',
      select: {
        reviewerDisplayName: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
      },
      where: {
        and: [
          { product: { equals: productId } },
          { moderationStatus: { equals: 'approved' } },
        ],
      },
    })

    return result.docs.flatMap((doc) => {
      const author = typeof doc.reviewerDisplayName === 'string' ? doc.reviewerDisplayName.trim() : ''
      const body = typeof doc.body === 'string' ? doc.body.trim() : ''
      if (!author || !body || typeof doc.rating !== 'number') return []

      return [
        {
          author,
          body,
          datePublished:
            typeof doc.createdAt === 'string' ? doc.createdAt.slice(0, 10) : undefined,
          rating: doc.rating,
          title: typeof doc.title === 'string' ? doc.title : undefined,
        },
      ]
    })
  } catch {
    return []
  }
}

const queryProductBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    populate: {
      variants: {
        title: true,
        priceInBDT: true,
        inventory: true,
        options: true,
      },
      categories: {
        slug: true,
        title: true,
      },
      subcategories: {
        parent: true,
        slug: true,
        title: true,
      },
    },
  })

  const doc = result.docs?.[0]
  if (doc?.brand && typeof doc.brand === 'number') {
    try {
      const brandDoc = await payload.findByID({
        collection: 'brands',
        id: doc.brand,
        depth: 0,
        draft,
        overrideAccess: draft,
      })
      if (brandDoc) {
        doc.brand = brandDoc
      }
    } catch {
      /* ignore missing brand */
    }
  }

  return doc || null
}

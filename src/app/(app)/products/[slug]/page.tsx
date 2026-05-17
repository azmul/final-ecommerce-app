import type { Media, Product } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { GridTileImage } from '@/components/Grid/tile'
import { Gallery } from '@/components/product/Gallery'
import { ProductDescription } from '@/components/product/ProductDescription'
import { ProductReviewsSection } from '@/components/product/ProductReviewsSection'
import { StripShopParamsFromProductUrl } from '@/components/product/StripShopParamsFromProductUrl'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ChevronLeftIcon, Sparkles } from 'lucide-react'
import { Metadata } from 'next'
import { ProductGeoSection } from '@/components/product/ProductGeoSection'
import { JsonLd } from '@/lib/seo/JsonLd'
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
} from '@/lib/seo/buildProductJsonLd'

import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

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
    seoContent?.aiSummary?.trim() ||
    product.meta?.description?.trim() ||
    (typeof product.title === 'string' ?
      `Shop ${product.title} online in Bangladesh — fast checkout and nationwide delivery.`
    : '')

  return {
    alternates: { canonical: canonicalUrl },
    description,
    other: {
      'ai-summary': description,
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

  const gallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as Media,
      })) || []

  const relatedProducts =
    product.relatedProducts?.filter((relatedProduct) => typeof relatedProduct === 'object') ?? []

  const jsonLdGraphs = [
    ...buildProductJsonLd(product, slug),
    buildProductBreadcrumbJsonLd(product, slug),
  ]

  return (
    <React.Fragment>
      <Suspense fallback={null}>
        <StripShopParamsFromProductUrl />
      </Suspense>
      <JsonLd data={jsonLdGraphs} />
      <div
        className={cn(
          cmsPageGutterClassName,
          'relative overflow-x-hidden pt-5 pb-14 sm:pb-24 sm:pt-7 lg:pt-8',
        )}
      >
        <div className="relative mx-auto w-full min-w-0 max-w-6xl space-y-10 sm:space-y-14 md:space-y-16">
          <div className="flex flex-col gap-3 sm:gap-4">
            <nav aria-label="Breadcrumb">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="-ms-2 h-11 min-h-11 shrink-0 gap-1 px-2 py-2 text-muted-foreground hover:text-foreground [-webkit-tap-highlight-color:transparent] sm:-ms-1 sm:h-auto sm:min-h-0 sm:py-1.5"
              >
                <Link href="/shop">
                  <ChevronLeftIcon className="size-4 shrink-0" aria-hidden />
                  <span className="text-sm font-medium">All products</span>
                </Link>
              </Button>
            </nav>

            <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-border/90 bg-background p-4 sm:p-5 md:p-6 lg:p-8 dark:border-border">
              <div className="flex flex-col items-stretch gap-8 sm:gap-10 lg:flex-row lg:justify-center lg:gap-12 xl:gap-16">
                <div className="mx-auto flex w-full min-h-0 min-w-0 max-w-lg shrink-0 flex-col justify-start sm:max-w-xl lg:mx-0 lg:max-w-[min(100%,440px)] lg:self-start xl:max-w-[min(100%,520px)]">
                  <Suspense
                    fallback={
                      <div className="mx-auto aspect-square max-w-lg animate-pulse rounded-2xl bg-muted/60 lg:mx-0" />
                    }
                  >
                    {Boolean(gallery?.length) && <Gallery gallery={gallery} />}
                  </Suspense>
                </div>

                <div className="mx-auto flex w-full min-w-0 max-w-xl shrink-0 flex-col lg:mx-0 lg:self-start">
                  <ProductDescription product={product} />
                </div>
              </div>
            </div>
          </div>

          {product.layout?.length ? <RenderBlocks blocks={product.layout} /> : null}

          <ProductGeoSection product={product} />

          <ProductReviewsSection
            productId={product.id}
            storefrontAverage={product.reviewAverageRating ?? null}
            storefrontCount={product.reviewCount ?? null}
          />

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

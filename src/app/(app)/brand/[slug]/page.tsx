import { BrandBreadcrumb } from '@/components/brand/BrandBreadcrumb'
import { BrandDescription } from '@/components/brand/BrandDescription'
import { TaxonomyGeoSection } from '@/components/seo/TaxonomyGeoSection'
import { buildCollectionPageJsonLd } from '@/lib/seo/buildCollectionPageJsonLd'
import { buildFaqJsonLd, getTaxonomySeoContent, parseFaqs } from '@/lib/seo/resolveGeoContent'
import { Grid } from '@/components/Grid'
import { Media } from '@/components/Media'
import { ProductGridItem } from '@/components/ProductGridItem'
import { Button } from '@/components/ui/button'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { brandLogoDisplayDimensions } from '@/utilities/brandLogoDisplayDimensions'
import configPromise from '@payload-config'
import { PackageSearch } from 'lucide-react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'
import type { Brand, Media as PayloadMedia } from '@/payload-types'

import { JsonLd } from '@/lib/seo/JsonLd'
import { buildBrandJsonLd } from '@/lib/seo/buildBrandJsonLd'
import { buildBreadcrumbJsonLd } from '@/lib/seo/buildBreadcrumbJsonLd'
import { ProductListingJsonLd } from '@/lib/seo/productListingJsonLd'
import { taxonomyMetadata } from '@/lib/seo/taxonomyMetadata'
import { getServerSideURL } from '@/utilities/getURL'
import type { Product } from '@/payload-types'

type Args = {
  params: Promise<{ slug: string }>
}

const getBrandBySlug = cache(async (slug: string): Promise<Brand | null> => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'brands',
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const doc = res.docs?.[0]
  return doc && typeof doc.id === 'number' ? doc : null
})

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)

  if (!brand) {
    return { title: 'Brand not found' }
  }

  const brandSeo = getTaxonomySeoContent(brand)

  return taxonomyMetadata({
    title: brand.title,
    meta: (brand as Brand & { meta?: Parameters<typeof taxonomyMetadata>[0]['meta'] }).meta,
    aiSummary: brandSeo?.aiSummary,
    fallbackDescription:
      typeof brand.description === 'string' && brand.description.trim() ?
        brand.description.trim().slice(0, 160)
      : `Shop ${brand.title} products online in Bangladesh.`,
    canonicalPath: `/brand/${slug}`,
    pageTitleSuffix: 'Brand',
  })
}

export default async function BrandPage({ params }: Args) {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)

  if (!brand) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: 500,
    overrideAccess: false,
    pagination: false,
    sort: 'title',
    select: {
      brand: true,
      categories: true,
      discountPercentage: true,
      enableVariants: true,
      gallery: true,
      inventory: true,
      priceInBDT: true,
      productBadge: true,
      slug: true,
      title: true,
    },
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          brand: {
            equals: brand.id,
          },
        },
      ],
    },
  })

  const count = products.docs.length
  const brandImage =
    typeof brand.image === 'object' && brand.image ? (brand.image as PayloadMedia) : null
  const brandSeo = getTaxonomySeoContent(brand)
  const descriptionText =
    brandSeo?.aiSummary?.trim() ||
    (typeof brand.description === 'string' ? brand.description.trim() : '')

  const base = getServerSideURL()
  const pageUrl = `${base}/brand/${slug}`
  const brandFaqs = parseFaqs(brandSeo?.faqs)
  const faqLd = brandFaqs.length > 0 ? buildFaqJsonLd(pageUrl, brandFaqs) : null

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Home', item: `${base}/` },
            { name: 'Brands', item: `${base}/all-brands` },
            { name: brand.title, item: pageUrl },
          ]),
          buildCollectionPageJsonLd({
            name: `${brand.title} products`,
            description: descriptionText || `Shop ${brand.title} online in Bangladesh.`,
            url: pageUrl,
            dateModified: brand.updatedAt,
          }),
          buildBrandJsonLd({
            brand: {
              id: brand.id,
              name: brand.title,
              slug,
              description: brand.description as Parameters<typeof buildBrandJsonLd>[0]['brand']['description'],
              image: brandImage,
            },
            brandUrl: pageUrl,
          }),
          ...(faqLd ? [faqLd] : []),
        ]}
      />
      <ProductListingJsonLd
        description={descriptionText || `Products from ${brand.title}`}
        name={`${brand.title} products`}
        pageUrl={pageUrl}
        products={products.docs as Product[]}
        dateModified={brand.updatedAt}
      />
      <div className="bg-muted/40">
      <div className={cn(cmsPageGutterClassName, 'space-y-10 pb-16 pt-8')}>
        <BrandBreadcrumb brandTitle={brand.title} />
        <h1 className="sr-only">{brand.title}</h1>

        <section
          aria-label={`${brand.title} overview`}
          className="flex flex-col gap-6 rounded-xl border border-border bg-background p-4 sm:p-6 md:flex-row md:items-start md:gap-8 md:p-8"
        >
          {brandImage ? (
            <div className="mx-auto shrink-0 rounded-lg border border-border bg-background p-4 md:mx-0">
              <div className="relative flex max-h-30 max-w-56 items-center justify-center sm:max-h-36 sm:max-w-64">
                <Media
                  className="relative block shrink-0"
                  {...brandLogoDisplayDimensions(brandImage, 144, 256)}
                  imgClassName="object-contain object-center"
                  priority
                  resource={brandImage}
                />
              </div>
            </div>
          ) : null}

          <div className="min-w-0 flex-1 pt-1">
            {!descriptionText && !brandImage ? (
              <p className="text-muted-foreground">
                Explore products from{' '}
                <span className="font-semibold text-foreground">{brand.title}</span> below.
              </p>
            ) : descriptionText ? (
              <BrandDescription text={descriptionText} />
            ) : (
              <p className="font-serif text-[15px] leading-relaxed text-muted-foreground sm:text-base md:text-[17px]">
                Explore our selection of{' '}
                <span className="font-semibold text-foreground">{brand.title}</span> products.
              </p>
            )}
          </div>
        </section>

        <TaxonomyGeoSection seoContent={brandSeo} title={brand.title} />

        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Brand Products
          </h2>
          <div aria-hidden className="mx-auto mt-3 h-1 w-14 rounded-full bg-primary" />
        </div>

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center sm:py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <PackageSearch className="h-7 w-7 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-4 max-w-md text-lg font-medium text-foreground">No products yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              There are no published products linked to this brand. Check back later or browse all
              products.
            </p>
            <Button asChild className="mt-6">
              <Link href="/shop">Browse shop</Link>
            </Button>
          </div>
        ) : (
          <Grid className="grid grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {products.docs.map((product, index) => (
              <ProductGridItem key={product.id} priority={index === 0} product={product} />
            ))}
          </Grid>
        )}
      </div>
    </div>
    </>
  )
}

import { BrandReadMore } from '@/components/brand/BrandReadMore'
import { Grid } from '@/components/Grid'
import { Media } from '@/components/Media'
import { ProductGridItem } from '@/components/ProductGridItem'
import { Button } from '@/components/ui/button'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { brandLogoDisplayDimensions } from '@/utilities/brandLogoDisplayDimensions'
import configPromise from '@payload-config'
import { ChevronLeftIcon, PackageSearch } from 'lucide-react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'
import type { Brand, Media as PayloadMedia } from '@/payload-types'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

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

  const descPreview =
    typeof brand.description === 'string' && brand.description.trim()
      ? brand.description.trim().slice(0, 160)
      : `${brand.title} · Shop products`
  const base = getServerSideURL()
  const canonicalUrl = `${base}/brand/${slug}`
  const metaTitle = `${brand.title} · Brand`
  const brandImage =
    brand.image && typeof brand.image === 'object' && 'url' in brand.image && brand.image.url
      ? toAbsoluteUrl(brand.image.url as string)
      : undefined

  return {
    alternates: { canonical: canonicalUrl },
    description: descPreview,
    openGraph: mergeOpenGraph({
      description: descPreview,
      images: brandImage ? [{ url: brandImage }] : undefined,
      title: metaTitle,
      url: canonicalUrl,
    }),
    title: metaTitle,
    twitter: {
      card: 'summary_large_image',
      description: descPreview,
      images: brandImage ? [brandImage] : undefined,
      title: metaTitle,
    },
  }
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
  const descriptionText =
    typeof brand.description === 'string' ? brand.description.trim() : ''

  return (
    <div className="bg-muted/40">
      <div className={cn(cmsPageGutterClassName, 'space-y-10 pb-16 pt-8')}>
        <h1 className="sr-only">{brand.title}</h1>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/shop">
            <ChevronLeftIcon />
            All products
          </Link>
        </Button>

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
              <BrandReadMore text={descriptionText} />
            ) : (
              <p className="font-serif text-[15px] leading-relaxed text-muted-foreground sm:text-base md:text-[17px]">
                Explore our selection of{' '}
                <span className="font-semibold text-foreground">{brand.title}</span> products.
              </p>
            )}
          </div>
        </section>

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
          <Grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.docs.map((product, index) => (
              <ProductGridItem key={product.id} priority={index === 0} product={product} />
            ))}
          </Grid>
        )}
      </div>
    </div>
  )
}

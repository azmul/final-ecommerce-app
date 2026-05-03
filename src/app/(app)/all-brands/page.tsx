import { Media } from '@/components/Media'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import configPromise from '@payload-config'
import { LayoutGrid } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import type { Brand, Media as MediaDoc } from '@/payload-types'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'

const canonicalUrl = `${getServerSideURL()}/all-brands`
const desc = 'Browse brands and shop their products.'

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl },
  description: desc,
  openGraph: mergeOpenGraph({
    description: desc,
    title: 'Popular Brands',
    url: canonicalUrl,
  }),
  title: 'Popular Brands',
  twitter: {
    card: 'summary_large_image',
    description: desc,
    title: 'Popular Brands',
  },
}

export default async function AllBrandsPage() {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'brands',
    depth: 1,
    limit: 200,
    pagination: false,
    select: {
      image: true,
      slug: true,
      title: true,
    },
    sort: 'title',
  })

  const brands = docs.filter(
    (doc): doc is Brand => typeof doc?.slug === 'string' && doc.slug.trim().length > 0,
  )

  return (
    <div className="bg-[#faf8f5] dark:bg-background">
      <div className={cn(cmsPageGutterClassName, 'py-10 sm:py-14')}>
        <header className="mb-10 text-center sm:mb-12">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Popular Brands
          </h1>
          <div aria-hidden className="mx-auto mt-3 h-1 w-14 rounded-full bg-primary" />
        </header>

        {brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <LayoutGrid className="h-7 w-7 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-4 max-w-md text-lg font-medium text-foreground">No brands yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Brands added in the admin will appear here. Each brand needs a URL slug before it can
              be linked from this page.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {brands.map((brand) => {
              const media =
                brand.image &&
                typeof brand.image === 'object' &&
                'url' in brand.image &&
                (brand.image.url || brand.image.filename)
                  ? (brand.image as MediaDoc)
                  : undefined

              return (
                <li className="min-w-0" key={brand.id}>
                  <Link
                    aria-label={`${brand.title} — view brand products`}
                    className={cn(
                      'group flex h-full min-w-0 w-full flex-col rounded-lg border border-border bg-background py-2 px-3 shadow-none transition-[box-shadow,transform] sm:py-2.5 sm:px-4',
                      'hover:-translate-y-0.5 hover:shadow-md',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f5]',
                      'dark:bg-card dark:focus-visible:ring-offset-background',
                    )}
                    href={`/brand/${brand.slug.trim()}`}
                  >
                    <div className="relative mx-auto flex h-14 w-full max-w-22 items-center justify-center overflow-hidden rounded-md bg-white dark:bg-muted sm:h-16 sm:max-w-24">
                      {media ? (
                        <Media
                          className="relative size-full"
                          fill
                          imgClassName="object-contain object-center p-1 transition duration-200 group-hover:scale-[1.03] sm:p-1.5"
                          resource={media}
                        />
                      ) : (
                        <span className="px-1.5 text-center font-semibold capitalize leading-tight text-muted-foreground line-clamp-3 group-hover:text-foreground text-xs sm:px-2 sm:text-sm">
                          {brand.title}
                        </span>
                      )}
                    </div>
                    <span className="sr-only">{brand.title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

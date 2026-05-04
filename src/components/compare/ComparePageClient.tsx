'use client'

import type { Category, Product, Subcategory, Variant } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { CompareBuyNowButton } from '@/components/compare/CompareBuyNowButton'
import { extractLexicalPlainText } from '@/utilities/extractLexicalPlainText'
import { useCompare } from '@/providers/Compare'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { XIcon } from 'lucide-react'
import React, { useMemo } from 'react'

function collectSpecLabels(products: Product[]): string[] {
  const labels = new Set<string>()

  for (const product of products) {
    for (const row of product.technicalSpecs ?? []) {
      const label = typeof row.label === 'string' ? row.label.trim() : ''
      if (label) labels.add(label)
    }
  }

  return [...labels].sort((a, b) => a.localeCompare(b))
}

function specValueForProduct(product: Product, label: string): string | null {
  const row = product.technicalSpecs?.find(
    (s) => typeof s.label === 'string' && s.label.trim() === label,
  )
  const value = typeof row?.value === 'string' ? row.value.trim() : ''
  return value.length ? value : null
}

function compareThumbnail(product: Product) {
  const first =
    product.gallery?.find((item) => typeof item.image === 'object')?.image ??
    (typeof product.meta?.image === 'object' ? product.meta.image : undefined)

  return first && typeof first !== 'string' ? first : null
}

function formatCategories(product: Product): string | null {
  const cats =
    product.categories?.filter((c): c is Category => typeof c === 'object' && c !== null) ?? []

  const titles = cats
    .map((c) => (typeof c.title === 'string' ? c.title.trim() : ''))
    .filter(Boolean)

  return titles.length ? titles.join(', ') : null
}

function formatSubcategories(product: Product): string | null {
  const subs =
    product.subcategories?.filter((s): s is Subcategory => typeof s === 'object' && s !== null) ??
    []

  const titles = subs
    .map((s) => (typeof s.title === 'string' ? s.title.trim() : ''))
    .filter(Boolean)

  return titles.length ? titles.join(', ') : null
}

function formatMetaSummary(product: Product): string | null {
  const raw = product.meta?.description
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t.length ? t : null
}

function formatDescriptionExcerpt(product: Product): string | null {
  return extractLexicalPlainText(product.description, 380)
}

function formatProductBadge(product: Product): string | null {
  const raw = product.productBadge
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t.length ? t : null
}

function stockLabel(product: Product): 'In stock' | 'Out of stock' {
  if (product.enableVariants) {
    const anyAvailable = product.variants?.docs?.some((v) => {
      if (!v || typeof v !== 'object') return false
      return (v.inventory ?? 0) > 0
    })
    return anyAvailable ? 'In stock' : 'Out of stock'
  }

  return (product.inventory ?? 0) > 0 ? 'In stock' : 'Out of stock'
}

function ComparePriceCell({ product }: { product: Product }) {
  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0

  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  if (hasVariants) {
    const prices = (product.variants?.docs ?? [])
      .filter((v): v is Variant => typeof v === 'object' && v !== null)
      .map((v) => v.priceInBDT)
      .filter((n): n is number => typeof n === 'number')

    if (!prices.length) {
      return <span className="text-muted-foreground">—</span>
    }

    const low = Math.min(...prices)
    const high = Math.max(...prices)

    if (hasDiscount) {
      const dLow = Math.round(low * (100 - discountPercent)) / 100
      const dHigh = Math.round(high * (100 - discountPercent)) / 100

      return (
        <div className="flex flex-col gap-1">
          <Price
            as="span"
            className="text-base font-semibold text-primary"
            highestAmount={dHigh}
            lowestAmount={dLow}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Price
              as="span"
              className="text-xs text-muted-foreground line-through"
              highestAmount={high}
              lowestAmount={low}
            />
            <span className="text-xs font-semibold text-primary">−{discountPercent}%</span>
          </div>
        </div>
      )
    }

    return (
      <Price
        as="span"
        className="text-base font-semibold"
        highestAmount={high}
        lowestAmount={low}
      />
    )
  }

  const amount = typeof product.priceInBDT === 'number' ? product.priceInBDT : undefined

  if (typeof amount !== 'number') {
    return <span className="text-muted-foreground">—</span>
  }

  if (hasDiscount) {
    const discounted = Math.round(amount * (100 - discountPercent)) / 100

    return (
      <div className="flex flex-col gap-1">
        <Price amount={discounted} as="span" className="text-base font-semibold text-primary" />
        <div className="flex flex-wrap items-center gap-2">
          <Price amount={amount} as="span" className="text-xs text-muted-foreground line-through" />
          <span className="text-xs font-semibold text-primary">−{discountPercent}%</span>
        </div>
      </div>
    )
  }

  return <Price amount={amount} as="span" className="text-base font-semibold" />
}

function MutedDash() {
  return <span className="text-muted-foreground">—</span>
}

type Props = {
  products: Product[]
  /** Column order — matches products array */
  columnIds: Product['id'][]
}

export function ComparePageClient({ products, columnIds }: Props) {
  const router = useRouter()
  const { remove } = useCompare()

  const specLabels = useMemo(() => collectSpecLabels(products), [products])

  const stickyHead =
    'sticky left-0 z-10 bg-background px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[6px_0_14px_-10px_rgba(0,0,0,0.35)] sm:px-4 dark:shadow-[6px_0_14px_-10px_rgba(0,0,0,0.65)]'

  const navigateAfterRemoval = (nextIds: Product['id'][]) => {
    if (nextIds.length >= 2) {
      router.replace(`/compare?ids=${nextIds.map(String).join(',')}`)
      return
    }

    if (nextIds.length === 1) {
      router.replace(`/compare?ids=${String(nextIds[0])}`)
      return
    }

    router.replace('/compare')
  }

  const removeProduct = (id: Product['id']) => {
    remove(id)
    const next = columnIds.filter((x) => String(x) !== String(id))
    navigateAfterRemoval(next)
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border shadow-sm [-webkit-overflow-scrolling:touch]">
        <table className="relative w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-20 w-[148px] min-w-[148px] bg-background px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[6px_0_14px_-10px_rgba(0,0,0,0.35)] sm:w-[172px] sm:min-w-[172px] sm:px-4 dark:shadow-[6px_0_14px_-10px_rgba(0,0,0,0.65)]"
                scope="col"
              >
                <span className="sr-only">Attribute</span>
              </th>
              {products.map((product) => (
                <th
                  className="border-l border-border bg-muted/25 px-3 py-4 align-bottom sm:px-5"
                  key={product.id}
                  scope="col"
                >
                  <div className="flex flex-col gap-3">
                    <Button
                      aria-label={`Remove ${product.title} from comparison`}
                      className="self-end"
                      onClick={() => removeProduct(product.id)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <XIcon aria-hidden className="size-4" strokeWidth={2} />
                    </Button>
                    <div className="relative mx-auto aspect-square w-full max-w-[160px] rounded-xl bg-muted/40 p-3">
                      {compareThumbnail(product) ? (
                        <Media
                          className="relative h-full w-full"
                          fill
                          imgClassName="object-contain"
                          resource={compareThumbnail(product)!}
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </span>
                      )}
                    </div>
                    <Link
                      className="text-center text-base font-semibold leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline"
                      href={`/products/${product.slug}`}
                    >
                      {product.title}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                Buy now
              </th>
              {products.map((product) => (
                <td
                  className="border-l border-border px-3 py-3 align-top sm:px-5"
                  key={`buy-${product.id}`}
                >
                  <CompareBuyNowButton product={product} />
                </td>
              ))}
            </tr>

            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                Brand
              </th>
              {products.map((product) => (
                <td className="border-l border-border px-3 py-3 align-top sm:px-5" key={product.id}>
                  {(() => {
                    const b = product.brand
                    if (
                      b &&
                      typeof b === 'object' &&
                      typeof b.title === 'string' &&
                      b.title.trim()
                    ) {
                      const slug = typeof b.slug === 'string' ? b.slug.trim() : ''
                      return slug ? (
                        <Link
                          className="font-medium text-primary hover:underline"
                          href={`/brand/${slug}`}
                        >
                          {b.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{b.title}</span>
                      )
                    }
                    return <MutedDash />
                  })()}
                </td>
              ))}
            </tr>

            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                Category
              </th>
              {products.map((product) => (
                <td className="border-l border-border px-3 py-3 align-top sm:px-5" key={product.id}>
                  {formatCategories(product) ? (
                    <span>{formatCategories(product)}</span>
                  ) : (
                    <MutedDash />
                  )}
                </td>
              ))}
            </tr>

            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                Subcategories
              </th>
              {products.map((product) => (
                <td className="border-l border-border px-3 py-3 align-top sm:px-5" key={product.id}>
                  {formatSubcategories(product) ? (
                    <span>{formatSubcategories(product)}</span>
                  ) : (
                    <MutedDash />
                  )}
                </td>
              ))}
            </tr>

            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                <span className="block">Badge</span>
                <span className="mt-1 block max-w-44 text-[10px] font-normal normal-case tracking-normal text-muted-foreground sm:max-w-none">
                  Card ribbon text
                </span>
              </th>
              {products.map((product) => (
                <td className="border-l border-border px-3 py-3 align-top sm:px-5" key={product.id}>
                  {formatProductBadge(product) ? (
                    <span className="inline-flex rounded-md bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
                      {formatProductBadge(product)}
                    </span>
                  ) : (
                    <MutedDash />
                  )}
                </td>
              ))}
            </tr>

            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                Price
              </th>
              {products.map((product) => (
                <td className="border-l border-border px-3 py-3 align-top sm:px-5" key={product.id}>
                  <ComparePriceCell product={product} />
                </td>
              ))}
            </tr>

            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                Availability
              </th>
              {products.map((product) => (
                <td className="border-l border-border px-3 py-3 align-top sm:px-5" key={product.id}>
                  {(() => {
                    const label = stockLabel(product)
                    return (
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                          label === 'In stock'
                            ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                            : 'bg-destructive/12 text-destructive dark:text-destructive',
                        )}
                      >
                        {label}
                      </span>
                    )
                  })()}
                </td>
              ))}
            </tr>

            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                <span className="block">Summary</span>
                <span className="mt-1 block max-w-44 text-[10px] font-normal normal-case tracking-normal text-muted-foreground sm:max-w-none">
                  SEO meta description
                </span>
              </th>
              {products.map((product) => (
                <td className="border-l border-border px-3 py-3 align-top sm:px-5" key={product.id}>
                  {formatMetaSummary(product) ? (
                    <p className="max-w-xs text-pretty leading-relaxed text-foreground">
                      {formatMetaSummary(product)}
                    </p>
                  ) : (
                    <MutedDash />
                  )}
                </td>
              ))}
            </tr>

            <tr className="border-t border-border">
              <th className={stickyHead} scope="row">
                <span className="block">Description</span>
                <span className="mt-1 block max-w-44 text-[10px] font-normal normal-case tracking-normal text-muted-foreground sm:max-w-none">
                  Excerpt from product copy
                </span>
              </th>
              {products.map((product) => (
                <td className="border-l border-border px-3 py-3 align-top sm:px-5" key={product.id}>
                  {formatDescriptionExcerpt(product) ? (
                    <p className="max-w-xs text-pretty leading-relaxed text-muted-foreground">
                      {formatDescriptionExcerpt(product)}
                    </p>
                  ) : (
                    <MutedDash />
                  )}
                </td>
              ))}
            </tr>

            {specLabels.map((specLabel) => (
              <tr className="border-t border-border" key={specLabel}>
                <th className={stickyHead} scope="row">
                  {specLabel}
                </th>
                {products.map((product) => (
                  <td
                    className="border-l border-border px-3 py-3 align-top sm:px-5"
                    key={`${product.id}-${specLabel}`}
                  >
                    {specValueForProduct(product, specLabel) ? (
                      <span>{specValueForProduct(product, specLabel)}</span>
                    ) : (
                      <MutedDash />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  )
}

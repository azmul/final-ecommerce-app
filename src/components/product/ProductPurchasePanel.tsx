'use client'

import type { Brand, Product } from '@/payload-types'
import Link from 'next/link'
import { Suspense, useCallback, useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AddToCart } from '@/components/Cart/AddToCart'
import { CompareCheckbox } from '@/components/compare/CompareCheckbox'
import { Media } from '@/components/Media'
import { ProductAlertRow } from '@/components/notifications/ProductAlertRow'
import { ProductSubscribePanel } from '@/components/product/ProductSubscribePanel'
import { ProductDeliveryEta } from '@/components/product/ProductDeliveryEta'
import { ProductQuantitySelector } from '@/components/product/ProductQuantitySelector'
import { StockIndicator } from '@/components/product/StockIndicator'
import { VariantSelector } from '@/components/product/VariantSelector'
import { useSelectedVariant } from '@/components/product/useSelectedVariant'
import { SocialShareRow } from '@/components/SocialShare/SocialShareRow'
import { WishlistButton } from '@/components/WishlistButton'
import { Button } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { buildTelHref, buildWhatsAppHref } from '@/lib/contact/phoneLinks'
import { sanitizeProductSeoText } from '@/lib/seo/sanitizeProductSeoText'
import { brandLogoDisplayDimensions } from '@/utilities/brandLogoDisplayDimensions'
import { cn } from '@/utilities/cn'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

import { CreditCard, Phone, RefreshCw, ShieldCheck, Truck } from 'lucide-react'

type Props = {
  contactPhone?: string
  product: Product
}

const actionButtonClassName =
  'min-h-11 w-full rounded-lg px-3 text-xs font-bold uppercase tracking-wide shadow-sm transition-all active:scale-[0.98]'

/** Interactive purchase UI only — product copy is server-rendered in ProductOverview. */
export function ProductPurchasePanel({ contactPhone, product }: Props) {
  const brandLabelId = useId()
  const router = useRouter()
  const { addItem, isLoading } = useCart()
  const selectedVariant = useSelectedVariant(product)
  const [quantity, setQuantity] = useState(1)

  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  const maxQuantity = useMemo(() => {
    if (hasVariants) {
      return selectedVariant?.inventory ?? 0
    }
    return product.inventory ?? 0
  }, [hasVariants, product.inventory, selectedVariant?.inventory])

  const brandDoc = resolveProductBrand(product)
  const brandImage =
    brandDoc?.image && typeof brandDoc.image === 'object' ? brandDoc.image : null
  const brandHref =
    brandDoc?.slug && typeof brandDoc.slug === 'string' && brandDoc.slug.trim().length > 0 ?
      `/brand/${brandDoc.slug.trim()}`
    : null

  const isOutOfStock = Boolean(
    (hasVariants && selectedVariant && selectedVariant.inventory === 0) ||
      (!hasVariants && (product.inventory ?? 0) === 0),
  )

  const needsVariantSelection = Boolean(hasVariants && !selectedVariant)

  const buyNowDisabled = isLoading || isOutOfStock || needsVariantSelection

  const buyNow = useCallback(() => {
    if (buyNowDisabled) return

    void Promise.resolve(
      addItem(
        {
          product: product.id,
          variant: selectedVariant?.id ?? undefined,
        },
        quantity,
      ),
    ).then(() => {
      router.push('/checkout')
    })
  }, [addItem, buyNowDisabled, product.id, quantity, router, selectedVariant?.id])

  const productUrl = `${getServerSideURL()}/products/${product.slug}`
  const whatsAppMessage = `Hi, I'd like to order: ${product.title}\nQuantity: ${quantity}\n${productUrl}`
  const whatsAppHref = buildWhatsAppHref(contactPhone, whatsAppMessage)
  const callHref = buildTelHref(contactPhone)

  const seo = (product as Product & { seoContent?: { aiSummary?: string | null } }).seoContent

  const brandCardInner = (
    <div className="flex flex-wrap items-center gap-2.5">
      <span
        className="text-sm font-medium text-foreground"
        id={brandLabelId}
      >
        Brand:
      </span>
      <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-xs">
        {brandImage ?
          <Media
            className="relative block shrink-0"
            {...brandLogoDisplayDimensions(brandImage, 36, 140)}
            imgClassName="object-contain object-left"
            resource={brandImage}
          />
        : brandDoc?.title ?
          <span className="text-sm font-semibold text-foreground">{brandDoc.title}</span>
        : null}
      </div>
    </div>
  )

  const brandCard =
    brandDoc && (brandImage || brandDoc.title) ?
      brandHref ?
        <Link
          aria-labelledby={brandLabelId}
          className="inline-flex outline-offset-4 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={brandHref}
        >
          {brandCardInner}
        </Link>
      : <div aria-labelledby={brandLabelId} role="group">
          {brandCardInner}
        </div>
    : null

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-5 sm:gap-6" id="purchase">
      {hasVariants ?
        <Suspense fallback={null}>
          <VariantSelector product={product} />
        </Suspense>
      : null}

      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted/50" aria-hidden />}>
        <StockIndicator product={product} />
      </Suspense>

      <ProductDeliveryEta />

      <ProductQuantitySelector
        disabled={isOutOfStock || needsVariantSelection}
        max={Math.max(1, maxQuantity)}
        onChange={setQuantity}
        value={quantity}
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Suspense fallback={<div className="h-11 animate-pulse rounded-lg bg-muted/50" aria-hidden />}>
          <AddToCart
            buttonClassName={cn(
              actionButtonClassName,
              'border-0 bg-orange-500 text-white hover:bg-orange-600',
            )}
            icon="bag"
            product={product}
            quantity={quantity}
          />
        </Suspense>

        <Button
          className={cn(actionButtonClassName, 'bg-slate-900 text-white hover:bg-slate-800')}
          disabled={buyNowDisabled}
          onClick={buyNow}
          type="button"
        >
          <CreditCard aria-hidden className="size-4 shrink-0" />
          Buy Now
        </Button>

        {whatsAppHref ?
          <Button
            asChild
            className={cn(actionButtonClassName, 'bg-emerald-600 text-white hover:bg-emerald-700')}
          >
            <a href={whatsAppHref} rel="noopener noreferrer" target="_blank">
              <WhatsAppIcon className="size-4 shrink-0" />
              Order On WhatsApp
            </a>
          </Button>
        : <Button
            className={cn(actionButtonClassName, 'bg-emerald-600 text-white hover:bg-emerald-700')}
            disabled
            title="Set CONTACT_PHONE or NEXT_PUBLIC_CONTACT_PHONE in your environment"
            type="button"
          >
            <WhatsAppIcon className="size-4 shrink-0" />
            Order On WhatsApp
          </Button>}

        {callHref ?
          <Button
            asChild
            className={cn(actionButtonClassName, 'bg-blue-600 text-white hover:bg-blue-700')}
          >
            <a href={callHref}>
              <Phone aria-hidden className="size-4 shrink-0" />
              Call For Order
            </a>
          </Button>
        : <Button
            className={cn(actionButtonClassName, 'bg-blue-600 text-white hover:bg-blue-700')}
            disabled
            title="Set CONTACT_PHONE or NEXT_PUBLIC_CONTACT_PHONE in your environment"
            type="button"
          >
            <Phone aria-hidden className="size-4 shrink-0" />
            Call For Order
          </Button>}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <Suspense fallback={null}>
          <WishlistButton className="min-h-11 w-full justify-center rounded-xl" product={product} showLabel />
        </Suspense>
        <div className="flex w-full [&>div]:min-h-11 [&>div]:w-full [&>div]:justify-center hover:bg-muted/40 rounded-xl transition-colors">
          <CompareCheckbox productId={product.id} variant="detail" />
        </div>
      </div>

      <ProductSubscribePanel product={product} />

      <Suspense fallback={<div className="h-14 animate-pulse rounded-xl bg-muted/25" aria-hidden />}>
        <ProductAlertRow product={product} />
      </Suspense>

      {brandCard}

      <TrustBadges />

      <div className="border-t border-border/60 pt-4">
        <SocialShareRow
          imageUrl={resolveProductShareImageUrl(product)}
          summary={
            sanitizeProductSeoText(seo?.aiSummary) ||
            (typeof product.meta?.description === 'string' && product.meta.description.trim()) ||
            `Shop ${product.title} online.`
          }
          title={product.title}
          url={productUrl}
        />
      </div>
    </div>
  )
}

function TrustBadges() {
  const badges = [
    { icon: <Truck className="size-4 text-primary" />, label: 'Fast Delivery', desc: 'Bangladesh nationwide' },
    { icon: <ShieldCheck className="size-4 text-primary" />, label: '100% Original', desc: 'Authenticity guaranteed' },
    { icon: <CreditCard className="size-4 text-primary" />, label: 'Secure Checkout', desc: 'Fully encrypted safety' },
    { icon: <RefreshCw className="size-4 text-primary" />, label: 'Easy Returns', desc: '7-day simple return' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4 mt-1">
      {badges.map((b, idx) => (
        <div key={idx} className="flex items-start gap-2 rounded-xl bg-muted/20 p-2 border border-border/30 dark:bg-muted/5">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border/50 shadow-2xs">
            {b.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground leading-tight">{b.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function resolveProductBrand(product: Product): Brand | null {
  const brand = product.brand
  if (brand && typeof brand === 'object') {
    return brand
  }
  return null
}

function resolveProductShareImageUrl(product: Product): string | undefined {
  const metaImg = typeof product.meta?.image === 'object' ? product.meta.image : undefined
  if (metaImg?.url) return toAbsoluteUrl(metaImg.url)

  const first = product.gallery?.find((item) => typeof item.image === 'object')?.image
  return first && typeof first === 'object' && typeof first.url === 'string' ?
      toAbsoluteUrl(first.url)
    : undefined
}

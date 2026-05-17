import type { Metadata } from 'next'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import { CheckoutStripeSetupNotice } from '@/components/checkout/CheckoutStripeSetupNotice'
import { noindexMetadata } from '@/lib/seo/noindexMetadata'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { ChevronRight, LockIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export default function Checkout() {
  return (
    <div className={cn(cmsPageGutterClassName, 'flex min-h-[90vh] flex-col pb-16')}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 pt-8 md:gap-12 md:pt-12">
        <CheckoutStripeSetupNotice />

        <header className="space-y-4">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
            <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/">
              Home
            </Link>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground/70" />
            <span className="font-medium text-foreground">Checkout</span>
          </nav>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Checkout</h1>
              <p className="max-w-xl text-muted-foreground">
                Review your details and place your order. Your information is handled securely for
                this purchase only.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground md:text-sm">
              <LockIcon aria-hidden className="size-4 shrink-0 text-primary" />
              <span className="text-foreground/80">Secure checkout</span>
            </div>
          </div>
        </header>

        <CheckoutPage />
      </div>
    </div>
  )
}

export const metadata: Metadata = noindexMetadata({
  description: 'Secure checkout — contact, delivery details, and order summary.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout',
})

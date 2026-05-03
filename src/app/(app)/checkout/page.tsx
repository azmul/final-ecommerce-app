import type { Metadata } from 'next'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import { Card, CardContent } from '@/components/ui/card'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { ChevronRight, LockIcon } from 'lucide-react'
import Link from 'next/link'
import React, { Fragment } from 'react'

export default function Checkout() {
  return (
    <div className={cn(cmsPageGutterClassName, 'flex min-h-[90vh] flex-col pb-16')}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 pt-8 md:gap-12 md:pt-12">
        {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
          <Card className="border-dashed border-amber-500/40 bg-amber-500/5 shadow-none dark:border-amber-500/30 dark:bg-amber-500/10">
            <CardContent className="pt-6 text-sm leading-relaxed text-foreground/90">
              <Fragment>
                {'To enable checkout, you must '}
                <a
                  className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                  href="https://dashboard.stripe.com/test/apikeys"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  obtain your Stripe API Keys
                </a>
                {' then set them as environment variables. See the '}
                <a
                  className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                  href="https://github.com/payloadcms/payload/blob/3.x/templates/ecommerce/README.md#stripe"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  README
                </a>
                {' for more details.'}
              </Fragment>
            </CardContent>
          </Card>
        )}

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

export const metadata: Metadata = {
  description: 'Secure checkout — contact, delivery details, and order summary.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout',
}

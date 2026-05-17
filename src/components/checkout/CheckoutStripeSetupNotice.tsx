'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utilities/cn'
import { CreditCard, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const DISMISS_KEY = 'checkout-stripe-notice-dismissed'

export function CheckoutStripeSetupNotice() {
  const hasStripeKey = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim())
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (hasStripeKey) return
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [hasStripeKey])

  if (hasStripeKey || dismissed) {
    return null
  }

  const isDev = process.env.NODE_ENV === 'development'

  function dismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
  }

  return (
    <Card
      className={cn(
        'relative border shadow-none',
        isDev
          ? 'border-amber-500/40 bg-amber-500/5 dark:border-amber-500/30 dark:bg-amber-500/10'
          : 'border-border bg-muted/30',
      )}
      role="status"
    >
      <CardContent className="flex gap-4 pt-6 pr-12 text-sm leading-relaxed text-foreground/90">
        <CreditCard
          aria-hidden
          className={cn('mt-0.5 size-5 shrink-0', isDev ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}
        />
        <div className="space-y-2">
          {isDev ? (
            <>
              <p className="font-medium text-foreground">
                Stripe is not configured (optional for local development)
              </p>
              <p>
                Checkout still works with <strong>cash on delivery</strong>. To test card payments,{' '}
                <a
                  className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                  href="https://dashboard.stripe.com/test/apikeys"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  add Stripe test keys
                </a>{' '}
                to your environment. See the{' '}
                <a
                  className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                  href="https://github.com/payloadcms/payload/blob/3.x/templates/ecommerce/README.md#stripe"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  ecommerce template README
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">Card payments are not available</p>
              <p>
                You can still complete your order with <strong>cash on delivery</strong>. Online card
                checkout will appear once Stripe is configured for this store.
              </p>
            </>
          )}
        </div>
      </CardContent>
      <Button
        aria-label="Dismiss notice"
        className="absolute right-2 top-2 size-8"
        onClick={dismiss}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X aria-hidden className="size-4" />
      </Button>
    </Card>
  )
}

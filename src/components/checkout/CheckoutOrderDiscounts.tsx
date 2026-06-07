'use client'

import { CheckoutGiftCard } from '@/components/checkout/CheckoutGiftCard'
import { CheckoutLoyaltyPoints } from '@/components/checkout/CheckoutLoyaltyPoints'
import { CheckoutPromoCode } from '@/components/checkout/CheckoutPromoCode'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ChevronDown, Tag } from 'lucide-react'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import React, { useEffect, useMemo, useState } from 'react'
import { cn } from '@/utilities/cn'

type Props = {
  cartId: number
}

export function CheckoutOrderDiscounts({ cartId }: Props) {
  const { cart } = useCart()

  const hasApplied = useMemo(() => {
    if (!cart) return false
    return (
      (typeof cart.appliedPromoCode === 'string' && cart.appliedPromoCode.length > 0) ||
      (typeof cart.appliedGiftCardCode === 'string' && cart.appliedGiftCardCode.length > 0) ||
      (typeof cart.appliedLoyaltyPoints === 'number' && cart.appliedLoyaltyPoints > 0)
    )
  }, [cart])

  const appliedSummary = useMemo(() => {
    if (!cart || !hasApplied) return null
    const parts: string[] = []
    if (typeof cart.appliedPromoCode === 'string' && cart.appliedPromoCode) {
      parts.push(`Promo: ${cart.appliedPromoCode}`)
    }
    if (typeof cart.appliedGiftCardCode === 'string' && cart.appliedGiftCardCode) {
      parts.push('Gift card applied')
    }
    if (typeof cart.appliedLoyaltyPoints === 'number' && cart.appliedLoyaltyPoints > 0) {
      parts.push(`${cart.appliedLoyaltyPoints} pts`)
    }
    return parts.join(' · ')
  }, [cart, hasApplied])

  const [open, setOpen] = useState(hasApplied)

  useEffect(() => {
    if (hasApplied) queueStateUpdate(() => setOpen(true))
  }, [hasApplied])

  return (
    <div className="shrink-0 border-t border-border/60 bg-muted/10">
      <button
        className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/20"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Tag aria-hidden className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            {hasApplied && appliedSummary ?
              appliedSummary
            : 'Promo code, gift card, or points'}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open ?
        <div className="space-y-1 border-t border-border/60 px-2 pb-3 pt-2">
          <CheckoutPromoCode cartId={cartId} compact />
          <CheckoutLoyaltyPoints cartId={cartId} compact />
          <CheckoutGiftCard cartId={cartId} compact />
        </div>
      : null}
    </div>
  )
}

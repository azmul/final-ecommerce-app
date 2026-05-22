'use client'

import { useAuth } from '@/providers/Auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Loader2, X } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

function readGuestCartSecret(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('cart_secret')
}

function errorMessageFromPayload(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return 'Something went wrong. Please try again.'
  }
  const b = body as { errors?: { message?: string }[]; message?: string }
  if (Array.isArray(b.errors) && b.errors[0]?.message) {
    return b.errors[0].message
  }
  if (typeof b.message === 'string') {
    return b.message
  }
  return 'Something went wrong. Please try again.'
}

type Props = {
  cartId: number
}

export function CheckoutPromoCode({ cartId }: Props) {
  const { user } = useAuth()
  const { refreshCart, cart } = useCart()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const applied = typeof cart?.appliedPromoCode === 'string' && cart.appliedPromoCode.length > 0

  const patchPromo = useCallback(
    async (appliedPromoCode: string | null) => {
      setBusy(true)
      try {
        const secret = user ? null : readGuestCartSecret()
        const qs = secret ? `?secret=${encodeURIComponent(secret)}` : ''
        const res = await fetch(`/api/carts/${cartId}${qs}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            appliedPromoCode === null ? { appliedPromoCode: null } : { appliedPromoCode },
          ),
        })
        const body = await res.json().catch(() => (null as unknown))
        if (!res.ok) {
          throw new Error(errorMessageFromPayload(body))
        }
        await refreshCart()
        if (appliedPromoCode === null) {
          toast.success('Promo code removed')
        } else {
          toast.success('Promo code applied')
        }
        setInput('')
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not update promo code.'
        toast.error(msg)
      } finally {
        setBusy(false)
      }
    },
    [cartId, refreshCart, user],
  )

  return (
    <div className="space-y-3 border-b border-border/60 px-6 py-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <FormFieldLabel htmlFor="checkout-promo-code">
            Promo code / coupon
          </FormFieldLabel>
          <Input
            autoCapitalize="characters"
            autoComplete="off"
            disabled={busy || applied}
            id="checkout-promo-code"
            name="promoCode"
            onChange={(e) => setInput(e.target.value)}
            placeholder={applied ? 'Code applied' : 'Enter code'}
            value={applied ? cart.appliedPromoCode ?? '' : input}
            readOnly={applied}
          />
        </div>
        {applied ? (
          <Button
            className="shrink-0"
            disabled={busy}
            onClick={() => void patchPromo(null)}
            type="button"
            variant="outline"
          >
            {busy ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <>
                <X aria-hidden className="mr-1.5 size-4" />
                Remove
              </>
            )}
          </Button>
        ) : (
          <Button
            className="shrink-0 touch-manipulation"
            disabled={busy || !input.trim()}
            onClick={() => void patchPromo(input)}
            type="button"
          >
            {busy ? (
              <>
                <Loader2 aria-hidden className="mr-2 size-4 animate-spin" />
                Applying…
              </>
            ) : (
              'Apply'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

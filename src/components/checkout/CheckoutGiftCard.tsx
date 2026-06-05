'use client'

import { useAuth } from '@/providers/Auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Gift, Loader2, X } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

type Props = { cartId: number }

function readGuestCartSecret(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('cart_secret')
}

export function CheckoutGiftCard({ cartId }: Props) {
  const { user } = useAuth()
  const { cart, refreshCart } = useCart()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const applied =
    typeof cart?.appliedGiftCardCode === 'string' && cart.appliedGiftCardCode.length > 0

  const patchGift = useCallback(
    async (appliedGiftCardCode: string | null) => {
      setBusy(true)
      try {
        const secret = user ? null : readGuestCartSecret()
        const qs = secret ? `?secret=${encodeURIComponent(secret)}` : ''
        const res = await fetch(`/api/carts/${cartId}${qs}`, {
          body: JSON.stringify(
            appliedGiftCardCode === null ?
              { appliedGiftCardCode: null }
            : { appliedGiftCardCode },
          ),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          const message =
            Array.isArray(body?.errors) && body.errors[0]?.message ?
              body.errors[0].message
            : 'Could not apply gift card.'
          throw new Error(message)
        }
        await refreshCart()
        toast.success(appliedGiftCardCode === null ? 'Gift card removed' : 'Gift card applied')
        setInput('')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not apply gift card.')
      } finally {
        setBusy(false)
      }
    },
    [cartId, refreshCart, user],
  )

  return (
    <div className="space-y-3 border-b border-border/60 px-6 py-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Gift className="size-4 text-primary" />
        Gift card
      </div>
      {applied ?
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span>{cart?.appliedGiftCardCode}</span>
          <Button
            disabled={busy}
            onClick={() => void patchGift(null)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          </Button>
        </div>
      : <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <FormFieldLabel htmlFor="gift-card-code">Code</FormFieldLabel>
            <Input
              id="gift-card-code"
              onChange={(e) => setInput(e.target.value)}
              placeholder="GIFT-XXXX"
              value={input}
            />
          </div>
          <Button
            disabled={busy || !input.trim()}
            onClick={() => void patchGift(input.trim())}
            type="button"
            variant="outline"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
          </Button>
        </div>
      }
    </div>
  )
}

'use client'

import { cartRequiresGuestSecret, readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import { useAuth } from '@/providers/Auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Gift, Loader2, X } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

type Props = { cartId: number; compact?: boolean }

export function CheckoutGiftCard({ cartId, compact = false }: Props) {
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
        const secret =
          cartRequiresGuestSecret({ cart, userId: user?.id }) ?
            readGuestCartSecret(cart)
          : undefined
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
    [cart, cartId, refreshCart, user],
  )

  return (
    <div className={compact ? 'px-2 py-2' : 'space-y-3 border-b border-border/60 px-6 py-4'}>
      {!compact ?
        <div className="flex items-center gap-2 text-sm font-medium">
          <Gift className="size-4 text-primary" />
          Gift card
        </div>
      : null}
      {applied ?
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span className="truncate">{cart?.appliedGiftCardCode}</span>
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
      : <div className="flex items-center gap-2">
          <Input
            aria-label="Gift card code"
            className="min-w-0 flex-1 text-sm"
            id="gift-card-code"
            onChange={(e) => setInput(e.target.value)}
            placeholder={compact ? 'Gift card code' : 'GIFT-XXXX'}
            value={input}
          />
          <Button
            disabled={busy || !input.trim()}
            onClick={() => void patchGift(input.trim())}
            size={compact ? 'sm' : 'default'}
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

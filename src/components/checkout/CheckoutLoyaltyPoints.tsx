'use client'

import { cartRequiresGuestSecret, readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import { LOYALTY_MIN_REDEEM } from '@/lib/loyalty/config'
import { useAuth } from '@/providers/Auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Gift, Loader2, X } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  cartId: number
  compact?: boolean
}

export function CheckoutLoyaltyPoints({ cartId, compact = false }: Props) {
  const { user } = useAuth()
  const { cart, refreshCart } = useCart()
  const [balance, setBalance] = useState(0)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const applied =
    typeof cart?.appliedLoyaltyPoints === 'number' && cart.appliedLoyaltyPoints > 0

  useEffect(() => {
    if (!user) return
    void fetch('/api/loyalty', { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { balance?: number }) => {
        if (typeof body.balance === 'number') setBalance(body.balance)
      })
      .catch(() => {})
  }, [user])

  const patchPoints = useCallback(
    async (appliedLoyaltyPoints: number | null) => {
      setBusy(true)
      try {
        const secret =
          cartRequiresGuestSecret({ cart, userId: user?.id }) ?
            readGuestCartSecret(cart)
          : undefined
        const qs = secret ? `?secret=${encodeURIComponent(secret)}` : ''
        const res = await fetch(`/api/carts/${cartId}${qs}`, {
          body: JSON.stringify(
            appliedLoyaltyPoints === null ?
              { appliedLoyaltyPoints: null }
            : { appliedLoyaltyPoints },
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
            : 'Could not apply loyalty points.'
          throw new Error(message)
        }
        await refreshCart()
        toast.success(appliedLoyaltyPoints === null ? 'Points removed' : 'Points applied')
        setInput('')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not apply points.')
      } finally {
        setBusy(false)
      }
    },
    [cart, cartId, refreshCart, user],
  )

  if (!user || balance < LOYALTY_MIN_REDEEM) return null

  return (
    <div className={compact ? 'px-2 py-2' : 'space-y-3 border-b border-border/60 px-6 py-4'}>
      {!compact ?
        <div className="flex items-center gap-2 text-sm font-medium">
          <Gift className="size-4 text-primary" />
          Loyalty points
          <span className="text-muted-foreground">({balance} available)</span>
        </div>
      : null}
      {applied ?
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span>{cart?.appliedLoyaltyPoints} points applied</span>
          <Button
            disabled={busy}
            onClick={() => void patchPoints(null)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          </Button>
        </div>
      : <div className="flex items-center gap-2">
          <Input
            aria-label={`Loyalty points (${balance} available)`}
            className="min-w-0 flex-1 text-sm"
            id="loyalty-points"
            min={LOYALTY_MIN_REDEEM}
            onChange={(e) => setInput(e.target.value)}
            placeholder={compact ? `Points (${balance} avail.)` : `Min ${LOYALTY_MIN_REDEEM}`}
            type="number"
            value={input}
          />
          <Button
            disabled={busy || !input}
            onClick={() => void patchPoints(Number(input))}
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

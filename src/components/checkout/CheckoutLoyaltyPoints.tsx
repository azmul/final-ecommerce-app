'use client'

import { LOYALTY_MIN_REDEEM } from '@/lib/loyalty/config'
import { useAuth } from '@/providers/Auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Gift, Loader2, X } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  cartId: number
}

function readGuestCartSecret(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('cart_secret')
}

export function CheckoutLoyaltyPoints({ cartId }: Props) {
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
        const secret = user ? null : readGuestCartSecret()
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
    [cartId, refreshCart, user],
  )

  if (!user || balance < LOYALTY_MIN_REDEEM) return null

  return (
    <div className="space-y-3 border-b border-border/60 px-6 py-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Gift className="size-4 text-primary" />
        Loyalty points
        <span className="text-muted-foreground">({balance} available)</span>
      </div>
      {applied ?
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
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
      : <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <FormFieldLabel htmlFor="loyalty-points">Points to use</FormFieldLabel>
            <Input
              id="loyalty-points"
              min={LOYALTY_MIN_REDEEM}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Min ${LOYALTY_MIN_REDEEM}`}
              type="number"
              value={input}
            />
          </div>
          <Button
            disabled={busy || !input}
            onClick={() => void patchPoints(Number(input))}
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

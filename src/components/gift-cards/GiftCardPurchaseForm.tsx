'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { FormItem } from '@/components/forms/FormItem'
import { cartRequiresGuestSecret, readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import { useAuth } from '@/providers/Auth'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Gift } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000]

export function GiftCardPurchaseForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { cart, refreshCart } = useCart()
  const [amount, setAmount] = useState(2000)
  const [customAmount, setCustomAmount] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const resolvedAmount =
    customAmount.trim() ? Number(customAmount) : amount

  async function purchase() {
    if (!user) {
      toast.message('Sign in to buy a gift card')
      router.push('/login?redirect=/gift-cards')
      return
    }

    if (!Number.isFinite(resolvedAmount) || resolvedAmount < 100) {
      toast.error('Enter an amount of at least ৳100.')
      return
    }

    if (!cart?.id) {
      toast.error('Could not load your cart. Refresh and try again.')
      return
    }

    setBusy(true)
    try {
      const secret =
        cartRequiresGuestSecret({ cart, userId: user.id }) ?
          readGuestCartSecret(cart)
        : undefined
      const qs = secret ? `?secret=${encodeURIComponent(secret)}` : ''
      const res = await fetch(`/api/carts/${cart.id}${qs}`, {
        body: JSON.stringify({
          giftCardPurchaseAmount: Math.round(resolvedAmount),
          giftCardRecipientEmail: recipientEmail.trim() || null,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      const body = (await res.json().catch(() => ({}))) as { errors?: { message?: string }[] }
      if (!res.ok) {
        throw new Error(body.errors?.[0]?.message || 'Could not add gift card to checkout.')
      }
      await refreshCart()
      toast.success('Gift card added to checkout')
      router.push('/checkout')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not continue to checkout.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift aria-hidden className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Buy a gift card</h2>
          <p className="text-sm text-muted-foreground">
            Choose an amount and complete checkout. Your unique code is issued when the order is confirmed.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((preset) => (
          <Button
            key={preset}
            onClick={() => {
              setAmount(preset)
              setCustomAmount('')
            }}
            size="sm"
            type="button"
            variant={amount === preset && !customAmount.trim() ? 'default' : 'outline'}
          >
            ৳{preset.toLocaleString()}
          </Button>
        ))}
      </div>

      <FormItem>
        <FormFieldLabel htmlFor="gift-card-custom">Custom amount (BDT)</FormFieldLabel>
        <Input
          id="gift-card-custom"
          inputMode="numeric"
          min={100}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="e.g. 3500"
          value={customAmount}
        />
      </FormItem>

      <FormItem>
        <FormFieldLabel htmlFor="gift-card-recipient">Recipient email (optional)</FormFieldLabel>
        <Input
          autoComplete="email"
          id="gift-card-recipient"
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Send the code here after purchase"
          type="email"
          value={recipientEmail}
        />
      </FormItem>

      <Button className="w-full" disabled={busy} onClick={() => void purchase()} type="button">
        {busy ? 'Adding…' : `Continue to checkout — ৳${resolvedAmount.toLocaleString()}`}
      </Button>
    </div>
  )
}

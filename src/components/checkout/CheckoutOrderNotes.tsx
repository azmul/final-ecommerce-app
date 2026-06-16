'use client'

import { cartRequiresGuestSecret, readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import { useAuth } from '@/providers/Auth'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  cartId: number
}

function errorMessageFromPayload(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Something went wrong.'
  const b = body as { errors?: { message?: string }[]; message?: string }
  return b.errors?.[0]?.message || b.message || 'Something went wrong.'
}

export function CheckoutOrderNotes({ cartId }: Props) {
  const { user } = useAuth()
  const { cart, refreshCart } = useCart()
  const [customerNote, setCustomerNote] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCustomerNote(typeof cart?.customerNote === 'string' ? cart.customerNote : '')
    setGiftMessage(typeof cart?.giftMessage === 'string' ? cart.giftMessage : '')
  }, [cart?.customerNote, cart?.giftMessage])

  const saveNotes = useCallback(async () => {
    setSaving(true)
    try {
      const secret =
        cartRequiresGuestSecret({ cart, userId: user?.id }) ?
          readGuestCartSecret(cart)
        : undefined
      const qs = secret ? `?secret=${encodeURIComponent(secret)}` : ''
      const res = await fetch(`/api/carts/${cartId}${qs}`, {
        body: JSON.stringify({
          customerNote: customerNote.trim() || null,
          giftMessage: giftMessage.trim() || null,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(errorMessageFromPayload(body))
      await refreshCart()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save notes.')
    } finally {
      setSaving(false)
    }
  }, [cart, cartId, customerNote, giftMessage, refreshCart, user?.id])

  return (
    <div className="space-y-4 border-b border-border/60 px-6 py-4">
      <div className="space-y-2">
        <FormFieldLabel htmlFor="checkout-customer-note">Order notes (optional)</FormFieldLabel>
        <Textarea
          id="checkout-customer-note"
          maxLength={500}
          onBlur={() => void saveNotes()}
          onChange={(e) => setCustomerNote(e.target.value)}
          placeholder="Delivery instructions, gate code, etc."
          rows={2}
          value={customerNote}
        />
      </div>
      <div className="space-y-2">
        <FormFieldLabel htmlFor="checkout-gift-message">Gift message (optional)</FormFieldLabel>
        <Textarea
          id="checkout-gift-message"
          maxLength={300}
          onBlur={() => void saveNotes()}
          onChange={(e) => setGiftMessage(e.target.value)}
          placeholder="Include a note with a gift order"
          rows={2}
          value={giftMessage}
        />
      </div>
      {saving ?
        <p className="text-xs text-muted-foreground">Saving notes…</p>
      : null}
    </div>
  )
}

'use client'

import { cartRequiresGuestSecret, readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/providers/Auth'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const TIME_SLOTS = [
  { label: 'Any time', value: '' },
  { label: 'Morning (9am – 12pm)', value: 'morning' },
  { label: 'Afternoon (12pm – 5pm)', value: 'afternoon' },
  { label: 'Evening (5pm – 8pm)', value: 'evening' },
] as const

type Props = {
  cartId: number
}

function minDeliveryDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function maxDeliveryDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

export function CheckoutDeliveryPreferences({ cartId }: Props) {
  const { user } = useAuth()
  const { cart, refreshCart } = useCart()
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('')
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('')
  const [saving, setSaving] = useState(false)

  const minDate = useMemo(() => minDeliveryDate(), [])
  const maxDate = useMemo(() => maxDeliveryDate(), [])

  useEffect(() => {
    const date =
      typeof cart?.preferredDeliveryDate === 'string' ?
        cart.preferredDeliveryDate.slice(0, 10)
      : ''
    setPreferredDeliveryDate(date)
    setDeliveryTimeSlot(
      typeof cart?.deliveryTimeSlot === 'string' ? cart.deliveryTimeSlot : '',
    )
  }, [cart?.deliveryTimeSlot, cart?.preferredDeliveryDate])

  const save = useCallback(
    async (overrides?: { deliveryTimeSlot?: string; preferredDeliveryDate?: string }) => {
      const slot = overrides?.deliveryTimeSlot ?? deliveryTimeSlot
      const date = overrides?.preferredDeliveryDate ?? preferredDeliveryDate
      setSaving(true)
      try {
        const secret =
          cartRequiresGuestSecret({ cart, userId: user?.id }) ?
            readGuestCartSecret(cart)
          : undefined
        const qs = secret ? `?secret=${encodeURIComponent(secret)}` : ''
        const res = await fetch(`/api/carts/${cartId}${qs}`, {
          body: JSON.stringify({
            deliveryTimeSlot: slot || null,
            preferredDeliveryDate: date || null,
          }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        const message =
          body && typeof body === 'object' && 'errors' in body ?
            (body as { errors?: { message?: string }[] }).errors?.[0]?.message
          : null
        throw new Error(message || 'Could not save delivery preferences.')
      }
      await refreshCart()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save delivery preferences.')
    } finally {
      setSaving(false)
    }
  }, [cart, cartId, deliveryTimeSlot, preferredDeliveryDate, refreshCart, user?.id])

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-muted/10 p-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Preferred delivery</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional — we will try to schedule around your preference when possible.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <FormFieldLabel htmlFor="preferred-delivery-date">Date</FormFieldLabel>
          <Input
            id="preferred-delivery-date"
            max={maxDate}
            min={minDate}
            onBlur={() => void save()}
            onChange={(e) => setPreferredDeliveryDate(e.target.value)}
            type="date"
            value={preferredDeliveryDate}
          />
        </div>
        <div className="space-y-1.5">
          <FormFieldLabel htmlFor="delivery-time-slot">Time window</FormFieldLabel>
          <Select
            onValueChange={(value) => {
              const next = value === 'any' ? '' : value
              setDeliveryTimeSlot(next)
              void save({ deliveryTimeSlot: next })
            }}
            value={deliveryTimeSlot || 'any'}
          >
            <SelectTrigger id="delivery-time-slot">
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot.value || 'any'} value={slot.value || 'any'}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {saving ?
        <p className="text-xs text-muted-foreground">Saving…</p>
      : null}
    </div>
  )
}

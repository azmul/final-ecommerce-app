'use client'

import type { Product, Variant } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/providers/Auth'
import { useSelectedVariant } from '@/components/product/useSelectedVariant'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  product: Product
}

const INTERVAL_OPTIONS = [
  { label: 'Every 2 weeks', value: 14 },
  { label: 'Every 30 days', value: 30 },
  { label: 'Every 60 days', value: 60 },
  { label: 'Every 90 days', value: 90 },
]

export function ProductSubscribePanel({ product }: Props) {
  const { user } = useAuth()
  const selectedVariant = useSelectedVariant(product)
  const [intervalDays, setIntervalDays] = useState(30)
  const [busy, setBusy] = useState(false)

  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)
  const needsVariant = hasVariants && !selectedVariant

  async function subscribe() {
    if (!user) {
      toast.message('Sign in to subscribe', {
        description: 'Repeat-order reminders are saved to your account.',
      })
      return
    }

    if (needsVariant) {
      toast.error('Select a variant before subscribing.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/subscriptions', {
        body: JSON.stringify({
          intervalDays,
          items: [
            {
              product: product.id,
              quantity: 1,
              ...(selectedVariant?.id ? { variant: selectedVariant.id } : {}),
            },
          ],
          shippingAddress: {
            district: 'Dhaka',
            fullAddress: 'Update in account settings after subscribing',
          },
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(body.error || 'Could not create subscription.')
      }
      toast.success('Reorder reminder set', {
        description: 'We will email and notify you when it is time to reorder. You place each order yourself.',
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not subscribe.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/80 bg-muted/15 px-4 py-4">
      <div className="mb-3 flex items-start gap-2">
        <RefreshCw aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Subscribe &amp; save time</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Get a reminder when it is time to reorder. You confirm and checkout each time — we do not auto-charge or auto-ship.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="subscribe-interval">Reminder interval</Label>
          <Select
            onValueChange={(value) => setIntervalDays(Number(value))}
            value={String(intervalDays)}
          >
            <SelectTrigger id="subscribe-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {user ?
          <Button disabled={busy || Boolean(needsVariant)} onClick={() => void subscribe()} type="button">
            {busy ? 'Saving…' : 'Subscribe'}
          </Button>
        : <Button asChild type="button" variant="outline">
            <Link href="/login">Sign in to subscribe</Link>
          </Button>}
      </div>
    </div>
  )
}

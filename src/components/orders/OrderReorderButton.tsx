'use client'

import type { Order } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  orderId: number | string
}

export function OrderReorderButton({ orderId }: Props) {
  const router = useRouter()
  const { refreshCart } = useCart()
  const [busy, setBusy] = useState(false)

  async function reorder() {
    setBusy(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, {
        credentials: 'include',
        method: 'POST',
      })
      const body = (await res.json().catch(() => ({}))) as {
        added?: number
        error?: string
        skipped?: number
      }
      if (!res.ok) {
        throw new Error(body.error || 'Could not reorder items.')
      }
      await refreshCart()
      toast.success(
        body.added ?
          `Added ${body.added} item${body.added === 1 ? '' : 's'} to cart`
        : 'Cart updated',
        {
          description:
            body.skipped ?
              `${body.skipped} unavailable item${body.skipped === 1 ? '' : 's'} skipped.`
            : undefined,
        },
      )
      router.push('/cart')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reorder.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button disabled={busy} onClick={() => void reorder()} size="sm" type="button" variant="outline">
      <RotateCcw aria-hidden className="mr-1.5 size-4" />
      {busy ? 'Adding…' : 'Buy again'}
    </Button>
  )
}

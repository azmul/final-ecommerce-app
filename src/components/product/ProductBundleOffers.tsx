'use client'

import { readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import type { ProductBundle } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Price } from '@/components/Price'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Package } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

type Props = { productId: number }

export function ProductBundleOffers({ productId }: Props) {
  const { cart, refreshCart } = useCart()
  const [bundles, setBundles] = useState<ProductBundle[]>([])
  const [loadingId, setLoadingId] = useState<number | null>(null)

  useEffect(() => {
    void fetch(`/api/bundles?productId=${productId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { docs?: ProductBundle[] }) => {
        setBundles(Array.isArray(body.docs) ? body.docs : [])
      })
      .catch(() => setBundles([]))
  }, [productId])

  if (!bundles.length) return null

  async function addBundle(bundleId: number) {
    if (!cart?.id) {
      toast.error('Add any item to cart first.')
      return
    }
    setLoadingId(bundleId)
    try {
      const secret = readGuestCartSecret(cart)
      const res = await fetch(`/api/bundles/${bundleId}/add-to-cart`, {
        body: JSON.stringify({
          cartId: cart.id,
          ...(secret ? { secret } : {}),
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!res.ok) throw new Error('Could not add bundle.')
      await refreshCart()
      toast.success('Bundle added to cart.')
    } catch {
      toast.error('Could not add bundle to cart.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/15 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Package className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Combo deals</h2>
      </div>
      <ul className="flex flex-col gap-3">
        {bundles.map((bundle) => (
          <li
            key={bundle.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3"
          >
            <div>
              <p className="font-medium">{bundle.title}</p>
              {typeof bundle.bundlePrice === 'number' ?
                <p className="text-sm text-muted-foreground">
                  Bundle price: <Price amount={bundle.bundlePrice} />
                </p>
              : null}
            </div>
            <Button
              disabled={loadingId === bundle.id}
              onClick={() => void addBundle(bundle.id)}
              size="sm"
              type="button"
            >
              {loadingId === bundle.id ? 'Adding…' : 'Add bundle'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

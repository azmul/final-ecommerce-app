'use client'

import { Button } from '@/components/ui/button'
import type { CartItem } from '@/components/Cart'
import type { Product } from '@/payload-types'
import { useWishlist } from '@/providers/Wishlist'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Bookmark } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  item: CartItem
}

export function CartSaveForLaterButton({ item }: Props) {
  const { removeItem } = useCart()
  const { add, isWishlisted } = useWishlist()
  const [busy, setBusy] = useState(false)

  const product = item.product
  const productDoc =
    product && typeof product === 'object' ? (product as Partial<Product> & { id: Product['id'] }) : null

  async function saveForLater() {
    if (!productDoc?.id || !item.id) return
    setBusy(true)
    try {
      if (!isWishlisted(productDoc.id)) {
        await add(productDoc)
      }
      await removeItem(item.id)
      toast.success('Saved for later')
    } catch {
      toast.error('Could not save item for later.')
    } finally {
      setBusy(false)
    }
  }

  if (!productDoc?.id) return null

  return (
    <Button
      className="h-8 px-2 text-xs"
      disabled={busy}
      onClick={() => void saveForLater()}
      type="button"
      variant="ghost"
    >
      <Bookmark aria-hidden className="mr-1 size-3.5" />
      Save for later
    </Button>
  )
}

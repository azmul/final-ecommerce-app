'use client'

import type { Product } from '@/payload-types'

import { HeartIcon } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useWishlist } from '@/providers/Wishlist'
import { cn } from '@/utilities/cn'

type WishlistProduct = Partial<Product> & { id?: Product['id'] }

type Props = {
  className?: string
  product: WishlistProduct
  showLabel?: boolean
}

export function WishlistButton({ className, product, showLabel = false }: Props) {
  const { isWishlisted, toggle } = useWishlist()
  const [isPending, setIsPending] = useState(false)
  const active = isWishlisted(product.id)

  const onClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!product.id || isPending) return

    setIsPending(true)

    try {
      const added = await toggle({ ...product, id: product.id })
      toast.success(added ? 'Added to wishlist.' : 'Removed from wishlist.')
    } catch {
      toast.error('Wishlist update failed. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      className={cn(
        showLabel
          ? 'rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground'
          : 'h-10 w-10 rounded-full border-border bg-background/90 p-0 text-muted-foreground shadow-sm backdrop-blur hover:text-primary',
        active && (showLabel ? 'bg-primary text-primary-foreground' : 'text-primary'),
        className,
      )}
      disabled={!product.id || isPending}
      onClick={onClick}
      type="button"
      variant="outline"
    >
      <HeartIcon className={cn('h-5 w-5', active && 'fill-current')} />
      {showLabel ? <span>{active ? 'Saved' : 'Save for later'}</span> : null}
    </Button>
  )
}

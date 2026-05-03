'use client'

import { OpenCartButton } from '@/components/Cart/OpenCart'
import { useCartSheet } from '@/components/Cart/CartSheetContext'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useMemo } from 'react'

export function CartNavTrigger() {
  const { cart } = useCart()
  const { open } = useCartSheet()

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity ?? 0) + quantity, 0)
  }, [cart])

  return <OpenCartButton onClick={() => open()} quantity={totalQuantity} type="button" />
}

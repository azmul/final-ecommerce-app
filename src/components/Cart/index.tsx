import React from 'react'

import { CartNavTrigger } from './CartNavTrigger'
import { Cart as CartType } from '@/payload-types'

export type CartItem = NonNullable<CartType['items']>[number]

/** Header nav cart control; `CartModal` and `FloatingCartBubble` mount from the root layout */
export function Cart() {
  return <CartNavTrigger />
}

export { CartModal } from './CartModal'
export { CartPageView } from './CartPageView'
export { FloatingCartBubble } from './FloatingCartBubble'
export { CartNavTrigger } from './CartNavTrigger'

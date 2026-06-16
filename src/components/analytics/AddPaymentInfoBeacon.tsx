'use client'

import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { cartLineToProductInput } from '@/lib/analytics/cartLineProduct'
import { toMetaCustomDataFromProducts } from '@/lib/analytics/meta/productContent'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect, useRef } from 'react'

export function AddPaymentInfoBeacon({ active }: { active: boolean }) {
  const { trackEvent } = useAnalyticsEvent()
  const { cart } = useCart()
  const tracked = useRef(false)

  useEffect(() => {
    if (!active || tracked.current || !cart?.id) return
    tracked.current = true

    const products =
      cart.items
        ?.map(cartLineToProductInput)
        .filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? []

    void trackEvent({
      cartId: cart.id,
      customData: toMetaCustomDataFromProducts(products, {
        currency: cart.currency ?? 'BDT',
        value: typeof cart.subtotal === 'number' ? cart.subtotal : undefined,
      }),
      eventType: 'add_payment_info',
      metadata: {
        paymentMethod: 'cash-on-delivery',
      },
    })
  }, [active, cart?.currency, cart?.id, cart?.items, cart?.subtotal, trackEvent])

  return null
}

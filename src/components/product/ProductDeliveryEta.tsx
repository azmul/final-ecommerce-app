'use client'

import { estimateDeliveryEta } from '@/lib/shipping/estimateDeliveryEta'
import { Truck } from 'lucide-react'
import React from 'react'

export function ProductDeliveryEta() {
  const eta = estimateDeliveryEta({ area: 'dhaka', deliveryType: 'home' })

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/10 px-3 py-2.5 text-sm">
      <Truck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="font-medium text-foreground">Estimated delivery</p>
        <p className="text-muted-foreground">{eta.label}. Exact timing depends on your district at checkout.</p>
      </div>
    </div>
  )
}

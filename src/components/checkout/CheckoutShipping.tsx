'use client'

import { Price } from '@/components/Price'
import type { CheckoutShippingQuote } from '@/lib/shipping/cartShipmentQuote'
import { cn } from '@/utilities/cn'
import { Loader2 } from 'lucide-react'
import React from 'react'

type Props = {
  deliveryType: 'point' | 'home'
  disabled?: boolean
  errorMessage?: string | null
  onDeliveryTypeChange: (value: 'point' | 'home') => void
  loading?: boolean
  quote: CheckoutShippingQuote | null
}

const deliveryModes: { label: string; value: 'point' | 'home'; description: string }[] = [
  { description: 'Collect from a courier point or locker.', label: 'Point delivery', value: 'point' },
  { description: 'Doorstep delivery.', label: 'Home delivery', value: 'home' },
]

export const CheckoutShipping: React.FC<Props> = ({
  deliveryType,
  disabled,
  errorMessage,
  onDeliveryTypeChange,
  loading,
  quote,
}) => {
  return (
    <div className={cn('space-y-4 rounded-xl border border-border/80 bg-muted/10 p-4')}>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Delivery method</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose handover style. Zones use your address district (Dhaka metro vs elsewhere).
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
        {deliveryModes.map((mode) => {
          const id = `delivery-${mode.value}`
          const checked = deliveryType === mode.value
          return (
            <label
              className={cn(
                'flex cursor-pointer gap-3 rounded-lg border bg-background px-3 py-2.5 shadow-sm transition-colors',
                checked && 'border-primary/40 ring-2 ring-primary/15',
              )}
              htmlFor={id}
              key={mode.value}
            >
              <input
                checked={checked}
                className="mt-1 size-4 shrink-0 accent-primary"
                disabled={Boolean(disabled || loading)}
                id={id}
                name="deliveryType"
                onChange={() => {
                  onDeliveryTypeChange(mode.value)
                }}
                type="radio"
                value={mode.value}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{mode.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{mode.description}</span>
              </span>
            </label>
          )
        })}
      </div>

      {loading ?
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 aria-hidden className="size-3.5 animate-spin shrink-0" />
          Updating shipping estimate…
        </div>
      : null}

      {errorMessage ?
        <p className="text-sm text-destructive">{errorMessage}</p>
      : null}

      {quote?.ok ?
        <>
          <div className="space-y-3 border-t border-border/60 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shipping by shipment profile
              {quote.orderCount > 1 ?
                <span className="ml-1 font-normal lowercase text-muted-foreground">
                  ({quote.orderCount} orders at payment)
                </span>
              : null}
            </p>

            <ul className="space-y-4">
              {quote.shipmentGroups.map((g, idx) => (
                <li
                  className="space-y-2 rounded-lg bg-background p-3 text-sm shadow-sm ring-1 ring-border/60"
                  key={`${idx}-${g.shipmentId ?? idx}`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                    <span className="font-medium text-foreground">
                      {g.shipmentName ?? `Shipment group ${idx + 1}`}
                    </span>
                    <span className="tabular-nums text-xs text-muted-foreground">Qty {g.totalQuantity}</span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {g.chargeLines.map((ln, lineIdx) => (
                      <li className="flex justify-between gap-3 text-xs" key={`${idx}-${lineIdx}-${ln.label}`}>
                        <span className="min-w-0 flex-1 text-muted-foreground">{ln.label}</span>
                        <Price
                          amount={ln.amountBdt}
                          as="span"
                          className="shrink-0 font-medium tabular-nums"
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2 text-sm font-semibold">
                    <span>Group total</span>
                    <Price amount={g.orderTotalBdt} as="span" className="tabular-nums" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3 text-sm font-semibold">
            <span>Shipping total</span>
            <Price amount={quote.totalShippingBdt} as="span" className="tabular-nums" />
          </div>
        </>
      : null}

      {!loading && quote === null ?
        <p className="text-xs text-muted-foreground">
          Select an address that includes district to preview shipping.
        </p>
      : null}
    </div>
  )
}

'use client'

import type { Product, Variant } from '@/payload-types'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BellRing, Loader2 } from 'lucide-react'

type AlertDoc = {
  id: number
  alertType: 'price_drop' | 'restock'
  active?: boolean | null
  variant?: number | Variant | null
}

export function ProductAlertRow({ product, className }: { product: Product; className?: string }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variantParam = searchParams.get('variant')

  const hasVariants = Boolean(product.enableVariants && (product.variants?.docs?.length ?? 0) > 0)

  const selectedVariant = useMemo(() => {
    if (!hasVariants || !variantParam) return undefined
    return product.variants?.docs?.find(
      (v): v is Variant => Boolean(v && typeof v === 'object' && String(v.id) === variantParam),
    )
  }, [hasVariants, product.variants?.docs, variantParam])

  const inventory = useMemo(() => {
    if (hasVariants) {
      if (!selectedVariant) return null
      return selectedVariant.inventory ?? 0
    }
    return product.inventory ?? 0
  }, [hasVariants, product.inventory, selectedVariant])

  const [alerts, setAlerts] = useState<AlertDoc[] | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    const res = await fetch(`/api/product-alerts?productId=${encodeURIComponent(String(product.id))}`, {
      credentials: 'include',
    })
    if (!res.ok) return
    const data = (await res.json()) as { docs?: AlertDoc[] }
    setAlerts(data.docs ?? [])
  }, [product.id, user])

  useEffect(() => {
    if (user) void refresh()
  }, [refresh, user])

  const loginRedirect = `/login?warning=${encodeURIComponent('Sign in to manage stock and price alerts.')}&redirect=${encodeURIComponent(`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}`

  const variantIdForApi =
    hasVariants && selectedVariant ? selectedVariant.id : undefined

  const hasPriceAlert = alerts?.some(
    (a) => a.alertType === 'price_drop' && a.active && matchVariantAlert(a, variantIdForApi),
  )
  const hasRestockAlert = alerts?.some(
    (a) => a.alertType === 'restock' && a.active && matchVariantAlert(a, variantIdForApi),
  )

  const createAlert = async (alertType: 'price_drop' | 'restock') => {
    if (!user) {
      toast.message('Sign in to create alerts.')
      return
    }
    if (hasVariants && !selectedVariant) {
      toast.message('Choose product options first, then you can subscribe.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/product-alerts', {
        body: JSON.stringify({
          alertType,
          productId: product.id,
          variantId: variantIdForApi,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const j = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        toast.error(j?.error || 'Could not save this alert.')
        return
      }
      toast.success(alertType === 'price_drop' ? 'Price drop alert saved.' : 'We will notify you when it is back in stock.')
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  const removeAlerts = async (alertType: 'price_drop' | 'restock') => {
    if (!alerts?.length) return
    setLoading(true)
    try {
      const targets = alerts.filter(
        (a) => a.alertType === alertType && matchVariantAlert(a, variantIdForApi),
      )
      for (const t of targets) {
        await fetch(`/api/product-alerts?id=${encodeURIComponent(String(t.id))}`, {
          credentials: 'include',
          method: 'DELETE',
        })
      }
      toast.message('Alert removed.')
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  const showOutOfStock = inventory !== null && inventory <= 0
  const gatedByVariant = hasVariants && !selectedVariant

  if (user === undefined) {
    return (
      <div
        className={cn('h-16 animate-pulse rounded-xl bg-muted/30', className)}
        aria-hidden
      />
    )
  }

  if (user === null) {
    return (
      <div className={cn('rounded-xl border border-border/80 bg-muted/15 px-4 py-3 text-sm text-muted-foreground', className)}>
        <div className="flex flex-wrap items-center gap-2">
          <BellRing className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>Want price drop or restock alerts?</span>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href={loginRedirect}>Sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-border/80 bg-muted/10 px-4 py-3', className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <BellRing className="h-4 w-4 text-primary" aria-hidden />
        Alerts
      </div>
      {gatedByVariant ?
        <p className="text-sm text-muted-foreground">
          Select colors or sizes above to subscribe to alerts for that exact item.
        </p>
      : <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            className="gap-2 sm:min-w-0"
            disabled={loading}
            onClick={() => (hasPriceAlert ? void removeAlerts('price_drop') : void createAlert('price_drop'))}
            size="sm"
            type="button"
            variant={hasPriceAlert ? 'secondary' : 'outline'}
          >
            {loading ?
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            : null}
            {hasPriceAlert ? 'Stop price alerts' : 'Alert me if price drops'}
          </Button>
          {showOutOfStock ?
            <Button
              className="gap-2"
              disabled={loading}
              onClick={() => (hasRestockAlert ? void removeAlerts('restock') : void createAlert('restock'))}
              size="sm"
              type="button"
              variant={hasRestockAlert ? 'secondary' : 'outline'}
            >
              {hasRestockAlert ? 'Stop stock alerts' : 'Alert me when back in stock'}
            </Button>
          : null}
        </div>
      }
      <p className="mt-2 text-xs text-muted-foreground">
        Manage delivery channels anytime under{' '}
        <Link className="font-medium text-primary underline-offset-2 hover:underline" href="/account/notifications">
          account notifications
        </Link>
        .
      </p>
    </div>
  )
}

function matchVariantAlert(alert: AlertDoc, variantId: number | undefined): boolean {
  const v = alert.variant
  const alertVariant =
    v == null ? undefined : typeof v === 'object' && 'id' in v ? Number(v.id) : Number(v)
  if (variantId == null) {
    return alertVariant == null
  }
  return alertVariant === variantId
}

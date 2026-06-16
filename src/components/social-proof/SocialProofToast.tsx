'use client'

import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import { cn } from '@/utilities/cn'
import { ShoppingBag } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

type RecentPurchase = {
  city?: string | null
  minutesAgo: number
  productTitle: string
}

const POLL_MS = 45_000
const VISIBLE_MS = 6_000

export function SocialProofToast() {
  const [item, setItem] = useState<RecentPurchase | null>(null)
  const [visible, setVisible] = useState(false)
  const queueRef = useRef<RecentPurchase[]>([])
  const shownRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/social-proof/recent')
        if (!res.ok || cancelled) return
        const body = (await res.json()) as { items?: RecentPurchase[] }
        const items = Array.isArray(body.items) ? body.items : []
        for (const row of items) {
          const key = `${row.productTitle}:${row.minutesAgo}`
          if (shownRef.current.has(key)) continue
          queueRef.current.push(row)
        }
      } catch {
        /* ignore */
      }
    }

    void poll()
    const interval = window.setInterval(() => void poll(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (visible || !queueRef.current.length) return

    const next = queueRef.current.shift()
    if (!next) return

    const key = `${next.productTitle}:${next.minutesAgo}`
    shownRef.current.add(key)

    queueStateUpdate(() => {
      setItem(next)
      setVisible(true)
    })

    const hideTimer = window.setTimeout(() => setVisible(false), VISIBLE_MS)
    return () => window.clearTimeout(hideTimer)
  }, [visible, item])

  useEffect(() => {
    if (visible || !item) return
    const t = window.setTimeout(() => setItem(null), 400)
    return () => window.clearTimeout(t)
  }, [visible, item])

  if (!item) return null

  const location = item.city?.trim() ? ` from ${item.city.trim()}` : ''

  return (
    <div
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed bottom-20 left-4 z-40 max-w-[min(20rem,calc(100vw-2rem))] transition-all duration-300 sm:bottom-6',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
      role="status"
    >
      <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag aria-hidden className="size-4" />
        </span>
        <p className="text-sm leading-snug text-foreground">
          Someone{location} purchased{' '}
          <span className="font-semibold">{item.productTitle}</span>
          {item.minutesAgo <= 60 ?
            ` ${item.minutesAgo} min ago`
          : ` ${Math.round(item.minutesAgo / 60)} hr ago`}
        </p>
      </div>
    </div>
  )
}

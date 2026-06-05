'use client'

import type { Subscription } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { RefreshCw } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function SubscriptionsPanel() {
  const [docs, setDocs] = useState<Subscription[] | null>(null)

  useEffect(() => {
    void fetch('/api/subscriptions', { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { docs?: Subscription[] }) => {
        setDocs(Array.isArray(body.docs) ? body.docs : [])
      })
      .catch(() => setDocs([]))
  }, [])

  async function toggleActive(id: number, active: boolean) {
    const res = await fetch('/api/subscriptions', {
      body: JSON.stringify({ active, id }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })
    if (!res.ok) {
      toast.error('Could not update subscription.')
      return
    }
    setDocs((prev) => (prev ?? []).map((row) => (row.id === id ? { ...row, active } : row)))
    toast.success(active ? 'Subscription resumed' : 'Subscription paused')
  }

  if (docs === null) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="h-24 animate-pulse rounded-lg bg-muted/40" aria-hidden />
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-primary/10 text-primary">
          <RefreshCw aria-hidden className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Repeat orders</h2>
          <p className="text-sm text-muted-foreground">
            Subscriptions remind you when it is time to reorder consumables.
          </p>
        </div>
      </div>

      {!docs.length ? (
        <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          You do not have any repeat orders yet. Subscribe from a product page to get reorder
          reminders.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {docs.map((sub) => (
            <li key={sub.id} className="rounded-lg border px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Every {sub.intervalDays} days
                  {sub.nextOrderAt ?
                    ` · next ${formatDateTime({ date: sub.nextOrderAt, format: 'MMM d, yyyy' })}`
                  : ''}
                </span>
                <Button
                  onClick={() => void toggleActive(sub.id, !sub.active)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {sub.active ? 'Pause' : 'Resume'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

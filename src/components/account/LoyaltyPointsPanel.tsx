'use client'

import type { LoyaltyTransaction } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { Gift } from 'lucide-react'
import React, { useEffect, useState } from 'react'

export function LoyaltyPointsPanel() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])

  useEffect(() => {
    void fetch('/api/loyalty', { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { balance?: number; transactions?: LoyaltyTransaction[] }) => {
        if (typeof body.balance === 'number') setBalance(body.balance)
        if (Array.isArray(body.transactions)) setTransactions(body.transactions)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-primary/10 text-primary">
          <Gift aria-hidden className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Loyalty points</h2>
          <p className="text-sm text-muted-foreground">
            Earn points on completed orders and redeem them at checkout.
          </p>
        </div>
      </div>

      <p className="text-3xl font-semibold tracking-tight">{balance.toLocaleString('en-BD')}</p>
      <p className="mt-1 text-sm text-muted-foreground">Available points</p>

      {transactions.length > 0 ?
        <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
          {transactions.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span>{row.description}</span>
              <span className={row.type === 'earn' ? 'text-emerald-700' : 'text-destructive'}>
                {row.type === 'earn' ? '+' : '-'}
                {row.points}
              </span>
              <time className="w-full text-xs text-muted-foreground" dateTime={row.createdAt}>
                {formatDateTime({ date: row.createdAt, format: 'MMM d, yyyy' })}
              </time>
            </li>
          ))}
        </ul>
      : null}
    </section>
  )
}

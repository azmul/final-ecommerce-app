'use client'

import { Button, toast } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getRiskFlagLabel } from '@/lib/risk/flagCatalog'

type RiskReviewRow = {
  id: number
  createdAt?: string
  riskAssessment?: {
    riskScore?: number | null
    riskLevel?: string | null
    riskReviewStatus?: string | null
    riskFlags?: { flag?: string | null; weight?: number | null; detail?: string | null }[] | null
  } | null
  customerPhone?: string | null
  customerEmail?: string | null
  name?: string | null
  email?: string | null
  amount?: number | null
  currency?: string | null
}

type CollectionSlug = 'orders' | 'users'

const riskLevelParam = 'riskLevel'
const reviewStatusParam = 'riskReviewStatus'

function formatDate(value: string | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amount !== 'number') return '—'
  return new Intl.NumberFormat(undefined, {
    currency: currency ?? 'BDT',
    style: 'currency',
  }).format(amount / 100)
}

function useReviewCollection(): CollectionSlug {
  const pathname = usePathname()
  return pathname.includes('/collections/users') ? 'users' : 'orders'
}

function RiskReviewQueueInner({ collection }: { collection: CollectionSlug }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<RiskReviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const isFiltered = useMemo(() => {
    return (
      searchParams.get(riskLevelParam) === 'high' &&
      searchParams.get(reviewStatusParam) === 'pending'
    )
  }, [searchParams])

  const loadQueue = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        depth: '0',
        limit: '10',
        sort: '-createdAt',
        'where[riskAssessment.riskLevel][equals]': 'high',
        'where[riskAssessment.riskReviewStatus][equals]': 'pending',
      })

      const response = await fetch(`/api/${collection}?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to load ${collection}`)
      }

      const json = (await response.json()) as { docs?: RiskReviewRow[] }
      setRows(json.docs ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load review queue')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    if (expanded) {
      void loadQueue()
    }
  }, [expanded, loadQueue])

  const applyListFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(riskLevelParam, 'high')
    params.set('where[riskAssessment.riskLevel][equals]', 'high')
    params.set(reviewStatusParam, 'pending')
    params.set('where[riskAssessment.riskReviewStatus][equals]', 'pending')
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  const clearListFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(riskLevelParam)
    params.delete(reviewStatusParam)
    params.delete('where[riskAssessment.riskLevel][equals]')
    params.delete('where[riskAssessment.riskReviewStatus][equals]')
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  const updateReviewStatus = async (
    id: number,
    status: 'cleared' | 'confirmed_fraud',
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/${collection}/${id}`, {
        body: JSON.stringify({
          riskAssessment: {
            riskReviewStatus: status,
            riskReviewedAt: new Date().toISOString(),
          },
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error('Failed to update review status')
      }

      toast.success(status === 'cleared' ? 'Marked as cleared' : 'Marked as confirmed fraud')
      await loadQueue()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    }
  }

  const title = collection === 'orders' ? 'High-risk orders (pending review)' : 'High-risk users (pending review)'

  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <button
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          gap: 12,
          padding: '14px 16px',
          textAlign: 'left',
          width: '100%',
        }}
        type="button"
      >
        <span
          style={{
            color: 'var(--theme-elevation-500)',
            display: 'inline-block',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          ▸
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 600 }}>{title}</span>
          <span style={{ color: 'var(--theme-elevation-600)', fontSize: 13 }}>
            Flag-only review queue — checkout and registration are never blocked automatically.
          </span>
        </span>
      </button>

      {expanded ? (
        <div style={{ borderTop: '1px solid var(--theme-elevation-150)', padding: '12px 16px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <Button buttonStyle="secondary" disabled={loading} onClick={() => void loadQueue()} size="small">
              Refresh
            </Button>
            <Button buttonStyle="secondary" onClick={applyListFilter} size="small">
              Filter list to pending high-risk
            </Button>
            {isFiltered ? (
              <Button buttonStyle="secondary" onClick={clearListFilter} size="small">
                Clear filter
              </Button>
            ) : null}
          </div>

          {loading ? <p style={{ fontSize: 13 }}>Loading…</p> : null}
          {!loading && rows.length === 0 ? (
            <p style={{ color: 'var(--theme-elevation-600)', fontSize: 13, margin: 0 }}>
              No pending high-risk {collection} right now.
            </p>
          ) : null}

          {!loading && rows.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {rows.map((row) => {
                const topFlag = row.riskAssessment?.riskFlags?.[0]
                const label =
                  collection === 'orders'
                    ? `#${row.id} · ${row.customerPhone ?? row.customerEmail ?? 'Guest'} · ${formatAmount(row.amount, row.currency)}`
                    : `${row.name ?? row.email ?? `User #${row.id}`}`

                return (
                  <div
                    key={row.id}
                    style={{
                      background: 'var(--theme-elevation-0)',
                      border: '1px solid var(--theme-elevation-150)',
                      borderRadius: 6,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <Link href={`/admin/collections/${collection}/${row.id}`} style={{ fontWeight: 600 }}>
                        {label}
                      </Link>
                      <span style={{ color: 'var(--theme-elevation-600)', fontSize: 12 }}>
                        Score {row.riskAssessment?.riskScore ?? 0} · {formatDate(row.createdAt)}
                      </span>
                    </div>
                    {topFlag?.flag ? (
                      <p style={{ fontSize: 12, margin: '6px 0 0' }}>
                        {getRiskFlagLabel(topFlag.flag)}
                        {topFlag.detail ? ` — ${topFlag.detail}` : ''}
                      </p>
                    ) : null}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      <Button
                        buttonStyle="secondary"
                        onClick={() => void updateReviewStatus(row.id, 'cleared')}
                        size="small"
                      >
                        Cleared
                      </Button>
                      <Button
                        buttonStyle="secondary"
                        onClick={() => void updateReviewStatus(row.id, 'confirmed_fraud')}
                        size="small"
                      >
                        Confirmed fraud
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export const RiskReviewQueueOrders = () => {
  return <RiskReviewQueueInner collection="orders" />
}

export const RiskReviewQueueUsers = () => {
  return <RiskReviewQueueInner collection="users" />
}

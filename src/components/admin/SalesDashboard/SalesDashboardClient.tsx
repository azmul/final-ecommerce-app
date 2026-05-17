'use client'

import type { SalesDashboardData, SalesDashboardPreset } from '@/lib/admin/salesDashboardTypes'
import { formatBdtAmount } from '@/lib/notifications/priceDropCopy'
import { Button } from '@payloadcms/ui'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import './index.scss'

const baseClass = 'sales-dashboard'

const PRESETS: { label: string; value: SalesDashboardPreset }[] = [
  { label: 'Today', value: 'today' },
  { label: '2 days', value: '2d' },
  { label: '7 days', value: '7d' },
  { label: '15 days', value: '15d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'Month to date', value: 'mtd' },
  { label: 'Year to date', value: 'ytd' },
  { label: 'Custom', value: 'custom' },
]

function formatDelta(kpi: { current: number; deltaPercent: number | null }): string {
  if (kpi.deltaPercent === null) return '—'
  const sign = kpi.deltaPercent > 0 ? '+' : ''
  return `${sign}${kpi.deltaPercent}% vs prior period`
}

function deltaClass(delta: number | null): string {
  if (delta === null || delta === 0) return 'flat'
  return delta > 0 ? 'up' : 'down'
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(d)
}

function paymentLabel(method: string): string {
  if (method === 'cash-on-delivery') return 'Cash on delivery'
  if (method === 'stripe') return 'Stripe'
  return method
}

export const SalesDashboardClient: React.FC = () => {
  const [preset, setPreset] = useState<SalesDashboardPreset>('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<SalesDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ preset })
    if (preset === 'custom') {
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
    }

    try {
      const res = await fetch(`/api/admin/sales-dashboard?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      const json = (await res.json()) as SalesDashboardData
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [endDate, preset, startDate])

  useEffect(() => {
    void load()
  }, [load])

  const maxDayRevenue = useMemo(() => {
    if (!data?.revenueByDay.length) return 1
    return Math.max(...data.revenueByDay.map((d) => d.revenue), 1)
  }, [data])

  const maxStatusCount = useMemo(() => {
    if (!data?.ordersByStatus.length) return 1
    return Math.max(...data.ordersByStatus.map((s) => s.count), 1)
  }, [data])

  const exportCsv = useCallback(() => {
    if (!data) return
    const lines = [
      'Sales dashboard export',
      `Period,${data.range.start} to ${data.range.end}`,
      '',
      'Metric,Current,Previous,Change %',
      `Revenue,${data.kpis.revenue.current},${data.kpis.revenue.previous},${data.kpis.revenue.deltaPercent ?? ''}`,
      `Orders,${data.kpis.orders.current},${data.kpis.orders.previous},${data.kpis.orders.deltaPercent ?? ''}`,
      `AOV,${data.kpis.averageOrderValue.current},${data.kpis.averageOrderValue.previous},${data.kpis.averageOrderValue.deltaPercent ?? ''}`,
      '',
      'Date,Orders,Revenue',
      ...data.revenueByDay.map((d) => `${d.date},${d.orders},${d.revenue}`),
      '',
      'Status,Count',
      ...data.ordersByStatus.map((s) => `${s.status},${s.count}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-dashboard-${data.range.preset}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  if (loading && !data) {
    return <div className={`${baseClass}__loading`}>Loading sales dashboard…</div>
  }

  if (error && !data) {
    return (
      <div className={`${baseClass}__error`}>
        <p>{error}</p>
        <Button buttonStyle="secondary" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const periodLabel = `${formatDateLabel(data.range.start)} – ${formatDateLabel(data.range.end)}`

  return (
    <div className={baseClass}>
      <header className={`${baseClass}__header`}>
        <h1 className={`${baseClass}__title`}>Sales dashboard</h1>
        <p className={`${baseClass}__subtitle`}>
          Revenue, orders, carts, and product performance for your store. Compare metrics to the
          previous period of equal length.
        </p>
        <p className={`${baseClass}__period`}>
          {periodLabel}
          {loading ? ' · Updating…' : ''}
        </p>
      </header>

      <div className={`${baseClass}__panel`}>
        <div className={`${baseClass}__toolbar`}>
          <div className={`${baseClass}__presets`} role="group" aria-label="Date range">
          {PRESETS.map((p) => (
            <Button
              key={p.value}
              buttonStyle={preset === p.value ? 'primary' : 'transparent'}
              className={`${baseClass}__preset${preset === p.value ? ' active' : ''}`}
              onClick={() => setPreset(p.value)}
              size="small"
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className={`${baseClass}__toolbar-actions`}>
          <Button buttonStyle="secondary" disabled={loading} onClick={() => void load()} size="small">
            Refresh
          </Button>
          <Button buttonStyle="secondary" onClick={exportCsv} size="small">
            Export CSV
          </Button>
        </div>
        </div>

        {preset === 'custom' ? (
          <div className={`${baseClass}__dates`}>
            <label>
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={() => void load()}
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={() => void load()}
              />
            </label>
          </div>
        ) : null}
      </div>

      <section className={`${baseClass}__section`} aria-label="Key metrics">
        <h2 className={`${baseClass}__section-title`}>Overview</h2>
        <div className={`${baseClass}__kpis`}>
        <div className={`${baseClass}__kpi`}>
          <span className={`${baseClass}__kpi-label`}>Revenue</span>
          <span className={`${baseClass}__kpi-value`}>{formatBdtAmount(data.kpis.revenue.current)}</span>
          <span className={`${baseClass}__kpi-delta ${deltaClass(data.kpis.revenue.deltaPercent)}`}>
            {formatDelta(data.kpis.revenue)}
          </span>
        </div>
        <div className={`${baseClass}__kpi`}>
          <span className={`${baseClass}__kpi-label`}>Orders</span>
          <span className={`${baseClass}__kpi-value`}>{data.kpis.orders.current}</span>
          <span className={`${baseClass}__kpi-delta ${deltaClass(data.kpis.orders.deltaPercent)}`}>
            {formatDelta(data.kpis.orders)}
          </span>
        </div>
        <div className={`${baseClass}__kpi`}>
          <span className={`${baseClass}__kpi-label`}>Avg. order value</span>
          <span className={`${baseClass}__kpi-value`}>
            {formatBdtAmount(data.kpis.averageOrderValue.current)}
          </span>
          <span
            className={`${baseClass}__kpi-delta ${deltaClass(data.kpis.averageOrderValue.deltaPercent)}`}
          >
            {formatDelta(data.kpis.averageOrderValue)}
          </span>
        </div>
        <div className={`${baseClass}__kpi`}>
          <span className={`${baseClass}__kpi-label`}>Promo discounts</span>
          <span className={`${baseClass}__kpi-value`}>
            {formatBdtAmount(data.kpis.promoDiscountTotal.current)}
          </span>
          <span
            className={`${baseClass}__kpi-delta ${deltaClass(data.kpis.promoDiscountTotal.deltaPercent)}`}
          >
            {formatDelta(data.kpis.promoDiscountTotal)}
          </span>
        </div>
        <div className={`${baseClass}__kpi`}>
          <span className={`${baseClass}__kpi-label`}>New customers</span>
          <span className={`${baseClass}__kpi-value`}>{data.kpis.newCustomers.current}</span>
          <span className={`${baseClass}__kpi-delta ${deltaClass(data.kpis.newCustomers.deltaPercent)}`}>
            {formatDelta(data.kpis.newCustomers)}
          </span>
        </div>
        <div className={`${baseClass}__kpi`}>
          <span className={`${baseClass}__kpi-label`}>Pending reviews</span>
          <span className={`${baseClass}__kpi-value`}>{data.pendingReviews}</span>
          <span className={`${baseClass}__kpi-delta flat`}>
            <Link href="/admin/collections/product-reviews">Moderate</Link>
          </span>
        </div>
        </div>
      </section>

      <section className={`${baseClass}__section`} aria-label="Charts">
        <h2 className={`${baseClass}__section-title`}>Trends</h2>
        <div className={`${baseClass}__grid-2`}>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Revenue over time</h2>
          {data.revenueByDay.length === 0 ?
            <p className={`${baseClass}__empty`}>No orders in this period.</p>
          : <div className={`${baseClass}__chart-bars`}>
              {data.revenueByDay.map((day) => (
                <div key={day.date} className={`${baseClass}__chart-bar-wrap`} title={`${day.date}: ${formatBdtAmount(day.revenue)}`}>
                  <div
                    className={`${baseClass}__chart-bar`}
                    style={{ height: `${Math.max(4, (day.revenue / maxDayRevenue) * 100)}%` }}
                  />
                  <span className={`${baseClass}__chart-label`}>{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
          }
        </section>

        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Orders by status</h2>
          {data.ordersByStatus.length === 0 ?
            <p className={`${baseClass}__empty`}>No orders in this period.</p>
          : <ul className={`${baseClass}__status-list`}>
              {data.ordersByStatus.map((row) => (
                <li key={row.status} className={`${baseClass}__status-row`}>
                  <span className={`${baseClass}__status-name`}>{row.status}</span>
                  <div className={`${baseClass}__status-bar`}>
                    <div
                      className={`${baseClass}__status-fill`}
                      style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                  <span className={`${baseClass}__status-count`}>{row.count}</span>
                </li>
              ))}
            </ul>
          }
        </section>
        </div>
      </section>

      <section className={`${baseClass}__section`} aria-label="Commerce details">
        <h2 className={`${baseClass}__section-title`}>Commerce</h2>
        <div className={`${baseClass}__grid-2`}>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Payment methods</h2>
          {data.paymentMethods.length === 0 ?
            <p className={`${baseClass}__empty`}>No succeeded transactions.</p>
          : <div className={`${baseClass}__table-wrap`}>
              <table className={`${baseClass}__table`}>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Transactions</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paymentMethods.map((row) => (
                    <tr key={row.method}>
                      <td>{paymentLabel(row.method)}</td>
                      <td>{row.count}</td>
                      <td>{formatBdtAmount(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </section>

        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Carts (period)</h2>
          <div className={`${baseClass}__table-wrap`}>
          <table className={`${baseClass}__table ${baseClass}__stat-rows`}>
            <tbody>
              <tr>
                <td>Active carts (with items)</td>
                <td>{data.carts.active}</td>
              </tr>
              <tr>
                <td>Converted (purchased)</td>
                <td>{data.carts.purchased}</td>
              </tr>
              <tr>
                <td>Abandoned (not purchased)</td>
                <td>{data.carts.abandoned}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </section>
        </div>
      </section>

      <section className={`${baseClass}__section`} aria-label="Products and promos">
        <h2 className={`${baseClass}__section-title`}>Products & promos</h2>
        <div className={`${baseClass}__grid-2`}>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Top products by revenue</h2>
          {data.topProductsByRevenue.length === 0 ?
            <p className={`${baseClass}__empty`}>No line items.</p>
          : <table className={`${baseClass}__table`}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProductsByRevenue.map((row) => (
                  <tr key={row.productId}>
                    <td>
                      <Link href={`/admin/collections/products/${row.productId}`}>{row.title}</Link>
                    </td>
                    <td>{row.quantity}</td>
                    <td>{formatBdtAmount(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </section>

        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Top products by quantity</h2>
          {data.topProductsByQuantity.length === 0 ?
            <p className={`${baseClass}__empty`}>No line items.</p>
          : <table className={`${baseClass}__table`}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProductsByQuantity.map((row) => (
                  <tr key={row.productId}>
                    <td>
                      <Link href={`/admin/collections/products/${row.productId}`}>{row.title}</Link>
                    </td>
                    <td>{row.quantity}</td>
                    <td>{formatBdtAmount(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </section>
      </div>

      <div className={`${baseClass}__grid-2`}>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Promo codes</h2>
          {data.topPromoCodes.length === 0 ?
            <p className={`${baseClass}__empty`}>No promo usage in period.</p>
          : <table className={`${baseClass}__table`}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Orders</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {data.topPromoCodes.map((row) => (
                  <tr key={row.code}>
                    <td>{row.code}</td>
                    <td>{row.orders}</td>
                    <td>{formatBdtAmount(row.discountTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </section>

        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Low stock (≤ 5 units)</h2>
          {data.lowStockProducts.length === 0 ?
            <p className={`${baseClass}__empty`}>No low-stock simple products.</p>
          : <table className={`${baseClass}__table`}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/admin/collections/products/${row.id}`}>{row.title}</Link>
                    </td>
                    <td>{row.inventory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </section>
        </div>
      </section>

      <section className={`${baseClass}__section`} aria-label="Recent orders">
        <h2 className={`${baseClass}__section-title`}>Activity</h2>
        <section className={`${baseClass}__card`}>
        <h2 className={`${baseClass}__card-title`}>Recent orders</h2>
        {data.recentOrders.length === 0 ?
          <p className={`${baseClass}__empty`}>No orders in this period.</p>
        : <table className={`${baseClass}__table`}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/collections/orders/${order.id}`}>#{order.id}</Link>
                  </td>
                  <td>{order.customerLabel}</td>
                  <td>{order.status ?? '—'}</td>
                  <td>{formatBdtAmount(order.amount)}</td>
                  <td>{formatDateLabel(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
        </section>
      </section>

      <nav className={`${baseClass}__quick-links`} aria-label="Quick links">
        <Link href="/admin/collections/orders">All orders</Link>
        <Link href="/admin/collections/transactions">Transactions</Link>
        <Link href="/admin/collections/carts">Carts</Link>
        <Link href="/admin/collections/promo-codes">Promo codes</Link>
      </nav>
    </div>
  )
}

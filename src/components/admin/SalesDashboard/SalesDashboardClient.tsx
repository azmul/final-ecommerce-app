'use client'

import { exportSalesDashboardPdf } from '@/lib/admin/exportSalesDashboardPdf'
import type { SalesDashboardData, SalesDashboardPreset } from '@/lib/admin/salesDashboardTypes'
import { formatBdtAmount } from '@/lib/notifications/priceDropCopy'
import { Button } from '@payloadcms/ui'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import './index.scss'

const baseClass = 'sales-dashboard'

type OverviewMetric =
  | 'revenue'
  | 'orders'
  | 'averageOrderValue'
  | 'promoDiscountTotal'
  | 'newCustomers'

type ChartPoint = { date: string; value: number }

const OVERVIEW_METRICS: {
  id: OverviewMetric
  label: string
  formatValue: (value: number) => string
  formatTooltip: (date: string, value: number) => string
}[] = [
  {
    id: 'revenue',
    label: 'Revenue',
    formatValue: formatBdtAmount,
    formatTooltip: (date, value) => `${date}: ${formatBdtAmount(value)}`,
  },
  {
    id: 'orders',
    label: 'Orders',
    formatValue: (value) => String(value),
    formatTooltip: (date, value) => `${date}: ${value} orders`,
  },
  {
    id: 'averageOrderValue',
    label: 'Avg. order value',
    formatValue: formatBdtAmount,
    formatTooltip: (date, value) => `${date}: ${formatBdtAmount(value)} AOV`,
  },
  {
    id: 'promoDiscountTotal',
    label: 'Promo discounts',
    formatValue: formatBdtAmount,
    formatTooltip: (date, value) => `${date}: ${formatBdtAmount(value)} discounts`,
  },
  {
    id: 'newCustomers',
    label: 'New customers',
    formatValue: (value) => String(value),
    formatTooltip: (date, value) => `${date}: ${value} customers`,
  },
]

function daySeriesForMetric(
  days: SalesDashboardData['revenueByDay'],
  metric: OverviewMetric,
): ChartPoint[] {
  return days.map((day) => {
    switch (metric) {
      case 'orders':
        return { date: day.date, value: day.orders }
      case 'averageOrderValue':
        return { date: day.date, value: day.averageOrderValue }
      case 'promoDiscountTotal':
        return { date: day.date, value: day.promoDiscount }
      default:
        return { date: day.date, value: day.revenue }
    }
  })
}

function chartPointsForMetric(data: SalesDashboardData, metric: OverviewMetric): ChartPoint[] {
  if (metric === 'newCustomers') {
    return data.newCustomersByDay.map((day) => ({ date: day.date, value: day.count }))
  }
  return daySeriesForMetric(data.revenueByDay, metric)
}

function priorChartPointsForMetric(data: SalesDashboardData, metric: OverviewMetric): ChartPoint[] {
  if (metric === 'newCustomers') return []
  return daySeriesForMetric(data.previousRevenueByDay, metric)
}

function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${value}%`
}

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
  const [selectedMetric, setSelectedMetric] = useState<OverviewMetric>('revenue')
  const [showPriorPeriod, setShowPriorPeriod] = useState(true)

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

  const selectedMetricConfig = useMemo(
    () => OVERVIEW_METRICS.find((m) => m.id === selectedMetric) ?? OVERVIEW_METRICS[0],
    [selectedMetric],
  )

  const chartPoints = useMemo(
    () => (data ? chartPointsForMetric(data, selectedMetric) : []),
    [data, selectedMetric],
  )

  const priorChartPoints = useMemo(
    () => (data ? priorChartPointsForMetric(data, selectedMetric) : []),
    [data, selectedMetric],
  )

  const maxChartValue = useMemo(() => {
    const values = [
      ...chartPoints.map((d) => d.value),
      ...(showPriorPeriod ? priorChartPoints.map((d) => d.value) : []),
    ]
    if (!values.length) return 1
    return Math.max(...values, 1)
  }, [chartPoints, priorChartPoints, showPriorPeriod])

  const maxDayOfWeekRevenue = useMemo(() => {
    if (!data?.salesByDayOfWeek.length) return 1
    return Math.max(...data.salesByDayOfWeek.map((d) => d.revenue), 1)
  }, [data])

  const maxStatusCount = useMemo(() => {
    if (!data?.ordersByStatus.length) return 1
    return Math.max(...data.ordersByStatus.map((s) => s.count), 1)
  }, [data])

  const exportPdf = useCallback(() => {
    if (!data) return
    exportSalesDashboardPdf(data)
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
      '',
      'Shipping revenue',
      String(data.shippingDelivery.summary.totalShippingRevenue),
      'Home delivery %',
      String(data.shippingDelivery.summary.homeDeliveryShare),
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
          <Button buttonStyle="secondary" disabled={loading || !data} onClick={exportPdf} size="small">
            Save PDF
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

      {data.insights.length > 0 ?
        <section className={`${baseClass}__insights`} aria-label="Business insights">
          <h2 className={`${baseClass}__section-title`}>Insights</h2>
          <ul className={`${baseClass}__insight-list`}>
            {data.insights.map((insight) => (
              <li key={insight.message} className={`${baseClass}__insight ${baseClass}__insight--${insight.tone}`}>
                {insight.message}
              </li>
            ))}
          </ul>
        </section>
      : null}

      <section className={`${baseClass}__section`} aria-label="Business health">
        <h2 className={`${baseClass}__section-title`}>Health</h2>
        <div className={`${baseClass}__health`}>
          <div className={`${baseClass}__health-card`}>
            <span className={`${baseClass}__health-label`}>Cart conversion</span>
            <span className={`${baseClass}__health-value`}>
              {formatPercent(data.health.cartConversionRate)}
            </span>
            <span className={`${baseClass}__health-hint`}>Purchased vs abandoned carts</span>
          </div>
          <div className={`${baseClass}__health-card`}>
            <span className={`${baseClass}__health-label`}>Cancel / refund rate</span>
            <span className={`${baseClass}__health-value`}>{data.health.cancellationRate}%</span>
            <span className={`${baseClass}__health-hint`}>
              {formatBdtAmount(data.health.revenueAtRisk)} at risk
            </span>
          </div>
          <div className={`${baseClass}__health-card`}>
            <span className={`${baseClass}__health-label`}>Promo usage</span>
            <span className={`${baseClass}__health-value`}>{data.health.promoUsageRate}%</span>
            <span className={`${baseClass}__health-hint`}>Orders with a promo code</span>
          </div>
          <div className={`${baseClass}__health-card`}>
            <span className={`${baseClass}__health-label`}>Repeat customer revenue</span>
            <span className={`${baseClass}__health-value`}>{data.health.repeatCustomerShare}%</span>
            <span className={`${baseClass}__health-hint`}>
              {data.health.repeatCustomers} of {data.health.uniqueCustomers} buyers
            </span>
          </div>
        </div>
      </section>

      <section className={`${baseClass}__section`} aria-label="Key metrics">
        <h2 className={`${baseClass}__section-title`}>Overview</h2>
        <div className={`${baseClass}__kpis`} role="list">
          {OVERVIEW_METRICS.map((metric) => {
            const kpi = data.kpis[metric.id]
            const isSelected = selectedMetric === metric.id

            return (
              <button
                key={metric.id}
                type="button"
                role="listitem"
                className={`${baseClass}__kpi${isSelected ? ` ${baseClass}__kpi--selected` : ''}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedMetric(metric.id)}
              >
                <span className={`${baseClass}__kpi-label`}>{metric.label}</span>
                <span className={`${baseClass}__kpi-value`}>
                  {metric.id === 'orders' || metric.id === 'newCustomers' ?
                    kpi.current
                  : formatBdtAmount(kpi.current)}
                </span>
                <span className={`${baseClass}__kpi-delta ${deltaClass(kpi.deltaPercent)}`}>
                  {formatDelta(kpi)}
                </span>
              </button>
            )
          })}
          <div className={`${baseClass}__kpi ${baseClass}__kpi--static`} role="listitem">
            <span className={`${baseClass}__kpi-label`}>Pending reviews</span>
            <span className={`${baseClass}__kpi-value`}>{data.pendingReviews}</span>
            <span className={`${baseClass}__kpi-delta flat`}>
              <Link href="/admin/collections/product-reviews">Moderate</Link>
            </span>
          </div>
        </div>

        <section
          className={`${baseClass}__card ${baseClass}__overview-chart`}
          aria-label={`${selectedMetricConfig.label} over time`}
        >
          <div className={`${baseClass}__chart-header`}>
            <h3 className={`${baseClass}__card-title`}>{selectedMetricConfig.label} over time</h3>
            {selectedMetric !== 'newCustomers' && priorChartPoints.length > 0 ?
              <label className={`${baseClass}__chart-toggle`}>
                <input
                  type="checkbox"
                  checked={showPriorPeriod}
                  onChange={(e) => setShowPriorPeriod(e.target.checked)}
                />
                Compare prior period
              </label>
            : null}
          </div>
          {chartPoints.length === 0 ?
            <p className={`${baseClass}__empty`}>No data in this period.</p>
          : <div className={`${baseClass}__chart-bars`}>
              {chartPoints.map((day, index) => {
                const prior = priorChartPoints[index]
                return (
                  <div
                    key={day.date}
                    className={`${baseClass}__chart-bar-wrap`}
                    title={selectedMetricConfig.formatTooltip(day.date, day.value)}
                  >
                    {showPriorPeriod && prior ?
                      <div
                        className={`${baseClass}__chart-bar ${baseClass}__chart-bar--prior`}
                        style={{ height: `${Math.max(4, (prior.value / maxChartValue) * 100)}%` }}
                        title={`Prior: ${selectedMetricConfig.formatTooltip(prior.date, prior.value)}`}
                      />
                    : null}
                    <div
                      className={`${baseClass}__chart-bar`}
                      style={{ height: `${Math.max(4, (day.value / maxChartValue) * 100)}%` }}
                    />
                    <span className={`${baseClass}__chart-label`}>{day.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          }
        </section>
      </section>

      <section className={`${baseClass}__section`} aria-label="Charts">
        <h2 className={`${baseClass}__section-title`}>Trends</h2>
        <div className={`${baseClass}__grid-2`}>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Revenue by day of week</h2>
          {data.salesByDayOfWeek.length === 0 ?
            <p className={`${baseClass}__empty`}>No orders in this period.</p>
          : <div className={`${baseClass}__chart-bars ${baseClass}__chart-bars--dow`}>
              {data.salesByDayOfWeek.map((day) => (
                <div
                  key={day.day}
                  className={`${baseClass}__chart-bar-wrap`}
                  title={`${day.label}: ${formatBdtAmount(day.revenue)} (${day.orders} orders)`}
                >
                  <div
                    className={`${baseClass}__chart-bar`}
                    style={{ height: `${Math.max(4, (day.revenue / maxDayOfWeekRevenue) * 100)}%` }}
                  />
                  <span className={`${baseClass}__chart-label`}>{day.label}</span>
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

      <section className={`${baseClass}__section`} aria-label="Category and brand breakdown">
        <h2 className={`${baseClass}__section-title`}>Assortment</h2>
        <div className={`${baseClass}__grid-2`}>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Top categories</h2>
          {data.topCategoriesByRevenue.length === 0 ?
            <p className={`${baseClass}__empty`}>No category data (products need categories).</p>
          : <table className={`${baseClass}__table`}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Share</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topCategoriesByRevenue.map((row) => (
                  <tr key={row.categoryId}>
                    <td>
                      <Link href={`/admin/collections/categories/${row.categoryId}`}>{row.title}</Link>
                    </td>
                    <td>{row.sharePercent}%</td>
                    <td>{formatBdtAmount(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </section>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Top brands</h2>
          {data.topBrandsByRevenue.length === 0 ?
            <p className={`${baseClass}__empty`}>No brand data (products need a brand).</p>
          : <table className={`${baseClass}__table`}>
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Share</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topBrandsByRevenue.map((row) => (
                  <tr key={row.brandId}>
                    <td>
                      <Link href={`/admin/collections/brands/${row.brandId}`}>{row.title}</Link>
                    </td>
                    <td>{row.sharePercent}%</td>
                    <td>{formatBdtAmount(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </section>
        </div>
      </section>

      <section className={`${baseClass}__section`} aria-label="Customers and regions">
        <h2 className={`${baseClass}__section-title`}>Customers & regions</h2>
        <div className={`${baseClass}__grid-2`}>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Top customers</h2>
          {data.topCustomers.length === 0 ?
            <p className={`${baseClass}__empty`}>No registered customers in this period.</p>
          : <table className={`${baseClass}__table`}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((row) => (
                  <tr key={row.customerId}>
                    <td>
                      <Link href={`/admin/collections/users/${row.customerId}`}>{row.label}</Link>
                    </td>
                    <td>{row.orders}</td>
                    <td>{formatBdtAmount(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </section>
        <section className={`${baseClass}__card`}>
          <h2 className={`${baseClass}__card-title`}>Orders by district</h2>
          {data.ordersByDistrict.length === 0 ?
            <p className={`${baseClass}__empty`}>No shipping districts in period.</p>
          : <table className={`${baseClass}__table`}>
              <thead>
                <tr>
                  <th>District</th>
                  <th>Orders</th>
                  <th>Share</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.ordersByDistrict.map((row) => (
                  <tr key={row.district}>
                    <td>{row.district}</td>
                    <td>{row.count}</td>
                    <td>{row.sharePercent}%</td>
                    <td>{formatBdtAmount(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </section>
        </div>
      </section>

      <section className={`${baseClass}__section`} aria-label="Shipping and delivery">
        <h2 className={`${baseClass}__section-title`}>Shipping &amp; Delivery Stats</h2>
        <div className={`${baseClass}__health`}>
          <div className={`${baseClass}__health-card`}>
            <span className={`${baseClass}__health-label`}>Shipping revenue</span>
            <span className={`${baseClass}__health-value`}>
              {formatBdtAmount(data.shippingDelivery.summary.totalShippingRevenue)}
            </span>
            <span className={`${baseClass}__health-hint`}>
              {data.shippingDelivery.summary.ordersWithShipping} paid shipping orders
            </span>
          </div>
          <div className={`${baseClass}__health-card`}>
            <span className={`${baseClass}__health-label`}>Avg. shipping / order</span>
            <span className={`${baseClass}__health-value`}>
              {formatBdtAmount(data.shippingDelivery.summary.avgShippingPerOrder)}
            </span>
            <span className={`${baseClass}__health-hint`}>Excludes cancelled &amp; refunded</span>
          </div>
          <div className={`${baseClass}__health-card`}>
            <span className={`${baseClass}__health-label`}>Home delivery</span>
            <span className={`${baseClass}__health-value`}>
              {data.shippingDelivery.summary.homeDeliveryShare}%
            </span>
            <span className={`${baseClass}__health-hint`}>vs point / locker pickup</span>
          </div>
          <div className={`${baseClass}__health-card`}>
            <span className={`${baseClass}__health-label`}>Dhaka zone</span>
            <span className={`${baseClass}__health-value`}>
              {data.shippingDelivery.summary.dhakaAreaShare}%
            </span>
            <span className={`${baseClass}__health-hint`}>
              {data.shippingDelivery.summary.freeDeliveryOrders} free-delivery orders
            </span>
          </div>
        </div>
        <div className={`${baseClass}__grid-2`}>
          <section className={`${baseClass}__card`}>
            <h2 className={`${baseClass}__card-title`}>Delivery method</h2>
            {data.shippingDelivery.byDeliveryType.length === 0 ?
              <p className={`${baseClass}__empty`}>No delivery preference data in period.</p>
            : <table className={`${baseClass}__table`}>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Orders</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shippingDelivery.byDeliveryType.map((row) => (
                    <tr key={row.type}>
                      <td>{row.label}</td>
                      <td>{row.count}</td>
                      <td>{row.sharePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </section>
          <section className={`${baseClass}__card`}>
            <h2 className={`${baseClass}__card-title`}>Delivery zone</h2>
            {data.shippingDelivery.byDeliveryArea.length === 0 ?
              <p className={`${baseClass}__empty`}>No delivery zone data in period.</p>
            : <table className={`${baseClass}__table`}>
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Orders</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shippingDelivery.byDeliveryArea.map((row) => (
                    <tr key={row.area}>
                      <td>{row.label}</td>
                      <td>{row.count}</td>
                      <td>{row.sharePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </section>
        </div>
        <div className={`${baseClass}__grid-2`}>
          <section className={`${baseClass}__card`}>
            <h2 className={`${baseClass}__card-title`}>Shipment profiles</h2>
            {data.shippingDelivery.byShipmentProfile.length === 0 ?
              <p className={`${baseClass}__empty`}>No shipment profile data in period.</p>
            : <table className={`${baseClass}__table`}>
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Orders</th>
                    <th>Share</th>
                    <th>Shipping</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shippingDelivery.byShipmentProfile.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.orders}</td>
                      <td>{row.sharePercent}%</td>
                      <td>{formatBdtAmount(row.shippingRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </section>
          <section className={`${baseClass}__card`}>
            <h2 className={`${baseClass}__card-title`}>Fulfillment pipeline</h2>
            <table className={`${baseClass}__table ${baseClass}__stat-rows`}>
              <tbody>
                <tr>
                  <td>Processing</td>
                  <td>{data.shippingDelivery.fulfillment.processing}</td>
                </tr>
                <tr>
                  <td>Shipped</td>
                  <td>{data.shippingDelivery.fulfillment.shipped}</td>
                </tr>
                <tr>
                  <td>Delivered</td>
                  <td>{data.shippingDelivery.fulfillment.delivered}</td>
                </tr>
                <tr>
                  <td>Completed</td>
                  <td>{data.shippingDelivery.fulfillment.completed}</td>
                </tr>
                <tr>
                  <td>With tracking number</td>
                  <td>{data.shippingDelivery.fulfillment.withTracking}</td>
                </tr>
              </tbody>
            </table>
            {data.shippingDelivery.fulfillment.byCarrier.length > 0 ?
              <>
                <h3 className={`${baseClass}__card-subtitle`}>Carriers</h3>
                <table className={`${baseClass}__table`}>
                  <thead>
                    <tr>
                      <th>Carrier</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.shippingDelivery.fulfillment.byCarrier.map((row) => (
                      <tr key={row.carrier}>
                        <td>{row.label}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            : null}
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
        <Link href="/admin/collections/shipments">Shipment profiles</Link>
      </nav>
    </div>
  )
}

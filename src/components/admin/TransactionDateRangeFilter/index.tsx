'use client'

import { Button } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

type PrintableValue = Record<string, unknown> | string | number | null | undefined

type LineItem = {
  product?: PrintableValue
  quantity?: number | null
  variant?: PrintableValue
}

const startDateParam = 'transactionStartDate'
const endDateParam = 'transactionEndDate'
const startWhereParam = 'where[createdAt][greater_than_equal]'
const endWhereParam = 'where[createdAt][less_than_equal]'

const escapeCSVValue = (value: unknown): string => {
  const stringValue = String(value ?? '')

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

const formatDateTime = (value: unknown): string => {
  if (!value || typeof value !== 'string') {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const formatCurrency = (amount: unknown, currency: unknown): string => {
  if (typeof amount !== 'number') {
    return ''
  }

  const currencyCode = typeof currency === 'string' ? currency : 'BDT'

  return new Intl.NumberFormat(undefined, {
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
    style: 'currency',
  }).format(amount / 100)
}

const getRelationLabel = (value: PrintableValue): string => {
  if (!value) {
    return ''
  }

  if (typeof value !== 'object') {
    return String(value)
  }

  const label =
    value.title ??
    value.name ??
    value.email ??
    value.sku ??
    value.slug ??
    value.id ??
    value.value ??
    ''

  return String(label)
}

const getAddress = (address: PrintableValue): string => {
  if (!address || typeof address !== 'object') {
    return ''
  }

  return [address.district, address.fullAddress].filter(Boolean).join(', ')
}

const getItems = (items: unknown): string => {
  if (!Array.isArray(items)) {
    return ''
  }

  return items
    .map((item: LineItem) => {
      const product = getRelationLabel(item.product)
      const variant = getRelationLabel(item.variant)
      const quantity = item.quantity ?? 0

      return [product, variant ? `Variant: ${variant}` : undefined, `Qty: ${quantity}`]
        .filter(Boolean)
        .join(' - ')
    })
    .join('\n')
}

const getStripePaymentIntentId = (doc: Record<string, unknown>): string => {
  const stripe = doc.stripe
  if (!stripe || typeof stripe !== 'object' || stripe === null) {
    return ''
  }

  const id = (stripe as { paymentIntentID?: unknown }).paymentIntentID

  return typeof id === 'string' ? id : ''
}

const getDateRangeParams = (startDate: string, endDate: string): URLSearchParams => {
  const params = new URLSearchParams()

  params.set('depth', '2')
  params.set('limit', '100')
  params.set('sort', '-createdAt')

  if (startDate) {
    params.set(startWhereParam, new Date(`${startDate}T00:00:00`).toISOString())
  }

  if (endDate) {
    params.set(endWhereParam, new Date(`${endDate}T23:59:59.999`).toISOString())
  }

  return params
}

const downloadFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const formatShortDate = (isoDate: string): string => {
  if (!isoDate) {
    return ''
  }

  const date = new Date(`${isoDate}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const TransactionDateRangeFilter = () => {
  const searchParams = useSearchParams()
  const [startDate, setStartDate] = useState(searchParams.get(startDateParam) ?? '')
  const [endDate, setEndDate] = useState(searchParams.get(endDateParam) ?? '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const hasDateFilter = useMemo(
    () => Boolean(searchParams.get(startDateParam) || searchParams.get(endDateParam)),
    [searchParams],
  )

  const activeStart = searchParams.get(startDateParam) ?? ''
  const activeEnd = searchParams.get(endDateParam) ?? ''
  const activeRangeSummary = useMemo(() => {
    if (!activeStart && !activeEnd) {
      return ''
    }
    if (activeStart && activeEnd) {
      return `${formatShortDate(activeStart)} – ${formatShortDate(activeEnd)}`
    }
    if (activeStart) {
      return `From ${formatShortDate(activeStart)}`
    }
    return `Until ${formatShortDate(activeEnd)}`
  }, [activeStart, activeEnd])

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete(startDateParam)
    params.delete(endDateParam)
    params.delete(startWhereParam)
    params.delete(endWhereParam)
    params.delete('page')

    if (startDate) {
      params.set(startDateParam, startDate)
      params.set(startWhereParam, new Date(`${startDate}T00:00:00`).toISOString())
    }

    if (endDate) {
      params.set(endDateParam, endDate)
      params.set(endWhereParam, new Date(`${endDate}T23:59:59.999`).toISOString())
    }

    window.location.href = `${window.location.pathname}?${params.toString()}`
  }

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete(startDateParam)
    params.delete(endDateParam)
    params.delete(startWhereParam)
    params.delete(endWhereParam)
    params.delete('page')

    const queryString = params.toString()
    window.location.href = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`
  }

  const downloadCSV = async () => {
    setIsDownloading(true)

    try {
      const rangeStart = searchParams.get(startDateParam) ?? startDate
      const rangeEnd = searchParams.get(endDateParam) ?? endDate

      const all: Record<string, unknown>[] = []
      let page = 1
      let hasNextPage = true

      while (hasNextPage) {
        const params = getDateRangeParams(rangeStart, rangeEnd)
        params.set('page', String(page))

        const response = await fetch(`/api/transactions?${params.toString()}`, {
          credentials: 'same-origin',
        })

        if (!response.ok) {
          throw new Error('Unable to download transactions.')
        }

        const result = await response.json()
        all.push(...(Array.isArray(result.docs) ? result.docs : []))
        hasNextPage = Boolean(result.hasNextPage)
        page += 1
      }

      const headers = [
        'Transaction ID',
        'Created',
        'Status',
        'Payment Method',
        'Customer',
        'Customer Email',
        'Order ID',
        'Cart ID',
        'Amount',
        'Currency',
        'Items',
        'Billing Address',
        'Stripe Payment Intent',
      ]

      const rows = all.map((tx) => [
        tx.id,
        formatDateTime(tx.createdAt),
        tx.status,
        tx.paymentMethod,
        getRelationLabel(tx.customer as PrintableValue),
        tx.customerEmail,
        getRelationLabel(tx.order as PrintableValue),
        getRelationLabel(tx.cart as PrintableValue),
        formatCurrency(tx.amount, tx.currency),
        tx.currency,
        getItems(tx.items),
        getAddress(tx.billingAddress as PrintableValue),
        getStripePaymentIntentId(tx),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => escapeCSVValue(cell)).join(','))
        .join('\n')

      downloadFile(`transactions-${rangeStart || 'all'}-to-${rangeEnd || 'all'}.csv`, csv)
    } catch (error) {
      console.error(error)
      window.alert('Unable to download transactions CSV. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--theme-elevation-50, #f7f7f7)',
        border: '1px solid var(--theme-elevation-150, #d9d9d9)',
        borderRadius: 8,
        display: 'grid',
        gap: isExpanded ? 16 : 0,
        margin: '0 0 24px',
        padding: '16px 8px',
      }}
    >
      <button
        aria-controls="transaction-date-filter-panel"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((open) => !open)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 6,
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          gap: 8,
          margin: '-4px -2px',
          padding: '4px 0',
          textAlign: 'left',
          width: '100%',
        }}
        type="button"
      >
        <span
          aria-hidden
          style={{
            alignItems: 'center',
            color: 'var(--theme-elevation-500)',
            display: 'inline-flex',
            flexShrink: 0,
            fontSize: 30,
            justifyContent: 'center',
            lineHeight: 1,
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            width: 36,
          }}
        >
          ▸
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              alignItems: 'baseline',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 10px',
              justifyContent: 'flex-start',
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.25,
              }}
            >
              Filter transactions by date
            </span>
            {!isExpanded && activeRangeSummary ? (
              <span
                style={{
                  background: 'var(--theme-elevation-100)',
                  borderRadius: 4,
                  color: 'var(--theme-elevation-700)',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '2px 8px',
                }}
              >
                {activeRangeSummary}
              </span>
            ) : null}
          </span>
          {isExpanded ? (
            <p
              style={{
                color: 'var(--theme-elevation-600)',
                fontSize: 13,
                margin: '6px 0 0',
              }}
            >
              Select a creation date range, then export the matching transactions as a CSV file.
            </p>
          ) : null}
        </span>
      </button>

      {isExpanded ? (
        <div id="transaction-date-filter-panel">
          <div
            style={{
              alignItems: 'end',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <label
              style={{
                display: 'grid',
                flex: '1 1 180px',
                gap: 6,
                maxWidth: 240,
              }}
            >
              <span style={{ color: 'var(--theme-elevation-700)', fontSize: 12, fontWeight: 600 }}>
                Start Date
              </span>
              <input
                onChange={(event) => setStartDate(event.target.value)}
                style={{
                  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: 4,
                  color: 'var(--theme-text)',
                  height: 38,
                  padding: '0 10px',
                  width: '100%',
                }}
                type="date"
                value={startDate}
              />
            </label>

            <label
              style={{
                display: 'grid',
                flex: '1 1 180px',
                gap: 6,
                maxWidth: 240,
              }}
            >
              <span style={{ color: 'var(--theme-elevation-700)', fontSize: 12, fontWeight: 600 }}>
                End Date
              </span>
              <input
                onChange={(event) => setEndDate(event.target.value)}
                style={{
                  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: 4,
                  color: 'var(--theme-text)',
                  height: 38,
                  padding: '0 10px',
                  width: '100%',
                }}
                type="date"
                value={endDate}
              />
            </label>

            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                flex: '1 1 280px',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <Button buttonStyle="secondary" onClick={applyFilter} size="medium" type="button">
                Filter transactions
              </Button>

              {hasDateFilter && (
                <Button buttonStyle="subtle" onClick={clearFilter} size="medium" type="button">
                  Clear filter
                </Button>
              )}

              <Button
                buttonStyle="primary"
                disabled={isDownloading}
                onClick={downloadCSV}
                size="medium"
                type="button"
              >
                {isDownloading ? 'Downloading...' : 'Download CSV'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

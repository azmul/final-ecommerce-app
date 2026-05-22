'use client'

import { Button, toast } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

type PrintableValue = Record<string, unknown> | string | number | null | undefined

const startWhereParam = 'where[createdAt][greater_than_equal]'
const endWhereParam = 'where[createdAt][less_than_equal]'

type FilterConfig = {
  apiPath: string
  csvFilenamePrefix: string
  depth: string
  endDateParam: string
  filterButtonLabel: string
  mapRow: (doc: Record<string, unknown>) => unknown[]
  csvHeaders: string[]
  panelId: string
  startDateParam: string
  summaryTitle: string
  exportDescription: string
}

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
    value.slug ??
    value.id ??
    value.value ??
    ''

  return String(label)
}

const getDateRangeParams = (
  startDate: string,
  endDate: string,
  depth: string,
): URLSearchParams => {
  const params = new URLSearchParams()

  params.set('depth', depth)
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

function TaxonomyDateRangeFilter({ config }: { config: FilterConfig }) {
  const searchParams = useSearchParams()
  const [startDate, setStartDate] = useState(searchParams.get(config.startDateParam) ?? '')
  const [endDate, setEndDate] = useState(searchParams.get(config.endDateParam) ?? '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const hasDateFilter = useMemo(
    () =>
      Boolean(searchParams.get(config.startDateParam) || searchParams.get(config.endDateParam)),
    [config.endDateParam, config.startDateParam, searchParams],
  )

  const activeStart = searchParams.get(config.startDateParam) ?? ''
  const activeEnd = searchParams.get(config.endDateParam) ?? ''
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

    params.delete(config.startDateParam)
    params.delete(config.endDateParam)
    params.delete(startWhereParam)
    params.delete(endWhereParam)
    params.delete('page')

    if (startDate) {
      params.set(config.startDateParam, startDate)
      params.set(startWhereParam, new Date(`${startDate}T00:00:00`).toISOString())
    }

    if (endDate) {
      params.set(config.endDateParam, endDate)
      params.set(endWhereParam, new Date(`${endDate}T23:59:59.999`).toISOString())
    }

    window.location.href = `${window.location.pathname}?${params.toString()}`
  }

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete(config.startDateParam)
    params.delete(config.endDateParam)
    params.delete(startWhereParam)
    params.delete(endWhereParam)
    params.delete('page')

    const queryString = params.toString()
    window.location.href = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`
  }

  const downloadCSV = async () => {
    setIsDownloading(true)

    try {
      const rangeStart = searchParams.get(config.startDateParam) ?? startDate
      const rangeEnd = searchParams.get(config.endDateParam) ?? endDate

      const allDocs: Record<string, unknown>[] = []
      let page = 1
      let hasNextPage = true

      while (hasNextPage) {
        const params = getDateRangeParams(rangeStart, rangeEnd, config.depth)
        params.set('page', String(page))

        const response = await fetch(`${config.apiPath}?${params.toString()}`, {
          credentials: 'same-origin',
        })

        if (!response.ok) {
          throw new Error(`Unable to download ${config.csvFilenamePrefix}.`)
        }

        const result = await response.json()
        allDocs.push(...(Array.isArray(result.docs) ? result.docs : []))
        hasNextPage = Boolean(result.hasNextPage)
        page += 1
      }

      const rows = allDocs.map((doc) => config.mapRow(doc))

      const csv = [config.csvHeaders, ...rows]
        .map((row) => row.map((cell) => escapeCSVValue(cell)).join(','))
        .join('\n')

      downloadFile(
        `${config.csvFilenamePrefix}-${rangeStart || 'all'}-to-${rangeEnd || 'all'}.csv`,
        csv,
      )
    } catch (error) {
      console.error(error)
      toast.error(`Unable to download ${config.csvFilenamePrefix} CSV. Please try again.`)
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
        aria-controls={config.panelId}
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
              {config.summaryTitle}
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
              {config.exportDescription}
            </p>
          ) : null}
        </span>
      </button>

      {isExpanded ? (
        <div id={config.panelId}>
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
                {config.filterButtonLabel}
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

const categoryFilterConfig: FilterConfig = {
  apiPath: '/api/categories',
  csvFilenamePrefix: 'categories',
  csvHeaders: ['Category ID', 'Title', 'Slug', 'Created', 'Updated'],
  depth: '0',
  endDateParam: 'categoryEndDate',
  exportDescription:
    'Select a creation date range, then export the matching categories as a CSV file.',
  filterButtonLabel: 'Filter categories',
  mapRow: (doc) => [
    doc.id,
    doc.title,
    doc.slug,
    formatDateTime(doc.createdAt),
    formatDateTime(doc.updatedAt),
  ],
  panelId: 'category-date-filter-panel',
  startDateParam: 'categoryStartDate',
  summaryTitle: 'Filter categories by date',
}

const subcategoryFilterConfig: FilterConfig = {
  apiPath: '/api/subcategories',
  csvFilenamePrefix: 'subcategories',
  csvHeaders: ['Subcategory ID', 'Title', 'Parent category', 'Slug', 'Created', 'Updated'],
  depth: '1',
  endDateParam: 'subcategoryEndDate',
  exportDescription:
    'Select a creation date range, then export the matching subcategories as a CSV file.',
  filterButtonLabel: 'Filter subcategories',
  mapRow: (doc) => [
    doc.id,
    doc.title,
    getRelationLabel(doc.parent as PrintableValue),
    doc.slug,
    formatDateTime(doc.createdAt),
    formatDateTime(doc.updatedAt),
  ],
  panelId: 'subcategory-date-filter-panel',
  startDateParam: 'subcategoryStartDate',
  summaryTitle: 'Filter subcategories by date',
}

const brandFilterConfig: FilterConfig = {
  apiPath: '/api/brands',
  csvFilenamePrefix: 'brands',
  csvHeaders: ['Brand ID', 'Title', 'Slug', 'Created', 'Updated'],
  depth: '0',
  endDateParam: 'brandEndDate',
  exportDescription: 'Select a creation date range, then export the matching brands as a CSV file.',
  filterButtonLabel: 'Filter brands',
  mapRow: (doc) => [
    doc.id,
    doc.title,
    doc.slug,
    formatDateTime(doc.createdAt),
    formatDateTime(doc.updatedAt),
  ],
  panelId: 'brand-date-filter-panel',
  startDateParam: 'brandStartDate',
  summaryTitle: 'Filter brands by date',
}

export const CategoryDateRangeFilter = () => (
  <TaxonomyDateRangeFilter config={categoryFilterConfig} />
)

export const SubcategoryDateRangeFilter = () => (
  <TaxonomyDateRangeFilter config={subcategoryFilterConfig} />
)

export const BrandDateRangeFilter = () => <TaxonomyDateRangeFilter config={brandFilterConfig} />

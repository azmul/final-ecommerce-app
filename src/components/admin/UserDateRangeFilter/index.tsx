'use client'

import { Button, toast } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'

const startDateParam = 'userStartDate'
const endDateParam = 'userEndDate'
const roleParam = 'userRole'
const startWhereParam = 'where[createdAt][greater_than_equal]'
const endWhereParam = 'where[createdAt][less_than_equal]'
const roleWhereParam = 'where[roles][contains]'

const USER_ROLE_OPTIONS = [
  { label: 'All roles', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'Customer', value: 'customer' },
  { label: 'Office staff', value: 'officeStaff' },
] as const

type UserRoleValue = (typeof USER_ROLE_OPTIONS)[number]['value']

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

const formatRoles = (roles: unknown): string => {
  if (!Array.isArray(roles)) {
    return ''
  }

  return roles.filter((r): r is string => typeof r === 'string').join('; ')
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

const getRoleLabel = (role: string): string => {
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
}

const buildListQueryParams = (startDate: string, endDate: string, role: UserRoleValue): URLSearchParams => {
  const params = new URLSearchParams()

  params.set('depth', '0')
  params.set('limit', '100')
  params.set('sort', '-createdAt')

  if (startDate) {
    params.set(startWhereParam, new Date(`${startDate}T00:00:00`).toISOString())
  }

  if (endDate) {
    params.set(endWhereParam, new Date(`${endDate}T23:59:59.999`).toISOString())
  }

  if (role) {
    params.set(roleWhereParam, role)
  }

  return params
}

const clearFilterParams = (params: URLSearchParams) => {
  params.delete(startDateParam)
  params.delete(endDateParam)
  params.delete(roleParam)
  params.delete(startWhereParam)
  params.delete(endWhereParam)
  params.delete(roleWhereParam)
  params.delete('page')
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

export const UserDateRangeFilter = () => {
  const searchParams = useSearchParams()
  const [startDate, setStartDate] = useState(searchParams.get(startDateParam) ?? '')
  const [endDate, setEndDate] = useState(searchParams.get(endDateParam) ?? '')
  const [role, setRole] = useState<UserRoleValue>(
    (searchParams.get(roleParam) as UserRoleValue) ?? '',
  )
  const [isDownloading, setIsDownloading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const activeStart = searchParams.get(startDateParam) ?? ''
  const activeEnd = searchParams.get(endDateParam) ?? ''
  const activeRole = searchParams.get(roleParam) ?? ''

  const hasActiveFilter = useMemo(
    () => Boolean(activeStart || activeEnd || activeRole),
    [activeEnd, activeRole, activeStart],
  )

  const activeRangeSummary = useMemo(() => {
    const parts: string[] = []

    if (activeRole) {
      parts.push(getRoleLabel(activeRole))
    }

    if (activeStart && activeEnd) {
      parts.push(`${formatShortDate(activeStart)} – ${formatShortDate(activeEnd)}`)
    } else if (activeStart) {
      parts.push(`From ${formatShortDate(activeStart)}`)
    } else if (activeEnd) {
      parts.push(`Until ${formatShortDate(activeEnd)}`)
    }

    return parts.join(' · ')
  }, [activeEnd, activeRole, activeStart])

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    clearFilterParams(params)

    if (startDate) {
      params.set(startDateParam, startDate)
      params.set(startWhereParam, new Date(`${startDate}T00:00:00`).toISOString())
    }

    if (endDate) {
      params.set(endDateParam, endDate)
      params.set(endWhereParam, new Date(`${endDate}T23:59:59.999`).toISOString())
    }

    if (role) {
      params.set(roleParam, role)
      params.set(roleWhereParam, role)
    }

    window.location.href = `${window.location.pathname}?${params.toString()}`
  }

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    clearFilterParams(params)

    const queryString = params.toString()
    window.location.href = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`
  }

  const downloadCSV = async () => {
    setIsDownloading(true)

    try {
      const rangeStart = searchParams.get(startDateParam) ?? startDate
      const rangeEnd = searchParams.get(endDateParam) ?? endDate
      const rangeRole = (searchParams.get(roleParam) ?? role) as UserRoleValue

      const allUsers: Record<string, unknown>[] = []
      let page = 1
      let hasNextPage = true

      while (hasNextPage) {
        const params = buildListQueryParams(rangeStart, rangeEnd, rangeRole)
        params.set('page', String(page))

        const response = await fetch(`/api/users?${params.toString()}`, {
          credentials: 'same-origin',
        })

        if (!response.ok) {
          throw new Error('Unable to download users.')
        }

        const result = await response.json()
        allUsers.push(...(Array.isArray(result.docs) ? result.docs : []))
        hasNextPage = Boolean(result.hasNextPage)
        page += 1
      }

      const headers = ['User ID', 'Name', 'Email', 'Roles', 'Phone', 'Created', 'Updated']

      const rows = allUsers.map((user) => [
        user.id,
        user.name,
        user.email,
        formatRoles(user.roles),
        user.phone,
        formatDateTime(user.createdAt),
        formatDateTime(user.updatedAt),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => escapeCSVValue(cell)).join(','))
        .join('\n')

      const roleSegment = rangeRole || 'all-roles'
      downloadFile(`users-${roleSegment}-${rangeStart || 'all'}-to-${rangeEnd || 'all'}.csv`, csv)
    } catch (error) {
      console.error(error)
      toast.error('Unable to download users CSV. Please try again.')
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
        aria-controls="user-filter-panel"
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
              Filter users
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
              Filter by role and account creation date, then export matching users as CSV.
            </p>
          ) : null}
        </span>
      </button>

      {isExpanded ? (
        <div id="user-filter-panel">
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
                flex: '1 1 160px',
                gap: 6,
                maxWidth: 200,
              }}
            >
              <span style={{ color: 'var(--theme-elevation-700)', fontSize: 12, fontWeight: 600 }}>
                Role
              </span>
              <select
                onChange={(event) => setRole(event.target.value as UserRoleValue)}
                style={{
                  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: 4,
                  color: 'var(--theme-text)',
                  height: 38,
                  padding: '0 10px',
                  width: '100%',
                }}
                value={role}
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                Start date
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
                End date
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
                Apply filters
              </Button>

              {hasActiveFilter ? (
                <Button buttonStyle="subtle" onClick={clearFilter} size="medium" type="button">
                  Clear filters
                </Button>
              ) : null}

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

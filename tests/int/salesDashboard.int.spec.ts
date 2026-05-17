import { buildDateRangeWhere } from '@/lib/admin/buildDateRangeWhere'
import { resolveSalesDateRange } from '@/lib/admin/resolveSalesDateRange'
import { describe, expect, it } from 'vitest'

describe('buildDateRangeWhere', () => {
  it('splits operators into and clauses', () => {
    const where = buildDateRangeWhere('createdAt', '2026-01-01T00:00:00.000Z', '2026-01-31T23:59:59.999Z')
    expect(where).toEqual({
      and: [
        { createdAt: { greater_than_equal: '2026-01-01T00:00:00.000Z' } },
        { createdAt: { less_than_equal: '2026-01-31T23:59:59.999Z' } },
      ],
    })
  })
})

describe('sales dashboard date range', () => {
  it('resolves 2d preset (today and yesterday)', () => {
    const range = resolveSalesDateRange({ preset: '2d' })
    const start = new Date(range.start)
    const end = new Date(range.end)
    const spanDays = Math.round((end.getTime() - start.getTime()) / 86400000)

    expect(range.preset).toBe('2d')
    expect(spanDays).toBeLessThanOrEqual(2)
    expect(new Date(range.previousStart).getTime()).toBeLessThan(start.getTime())
  })

  it('resolves today preset with yesterday as prior period', () => {
    const range = resolveSalesDateRange({ preset: 'today' })
    const start = new Date(range.start)
    const end = new Date(range.end)
    const previousEnd = new Date(range.previousEnd)

    expect(range.preset).toBe('today')
    expect(start.getDate()).toBe(end.getDate())
    expect(start.getMonth()).toBe(end.getMonth())
    expect(start.getFullYear()).toBe(end.getFullYear())
    expect(previousEnd.getTime()).toBeLessThan(start.getTime())
  })

  it('resolves 15d preset with prior period', () => {
    const range = resolveSalesDateRange({ preset: '15d' })
    expect(range.preset).toBe('15d')
    expect(new Date(range.start).getTime()).toBeLessThan(new Date(range.end).getTime())
    expect(new Date(range.previousStart).getTime()).toBeLessThan(new Date(range.start).getTime())
  })

  it('resolves 30d preset with prior period', () => {
    const range = resolveSalesDateRange({ preset: '30d' })
    expect(new Date(range.start).getTime()).toBeLessThan(new Date(range.end).getTime())
    expect(new Date(range.previousStart).getTime()).toBeLessThan(new Date(range.start).getTime())
    expect(range.preset).toBe('30d')
  })

  it('resolves custom range', () => {
    const range = resolveSalesDateRange({
      preset: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })
    const start = new Date(range.start)
    const end = new Date(range.end)
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(0)
    expect(start.getDate()).toBe(1)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(0)
    expect(end.getDate()).toBe(31)
  })
})

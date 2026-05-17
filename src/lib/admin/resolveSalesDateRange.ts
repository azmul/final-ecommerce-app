import type { SalesDashboardPreset, SalesDateRange } from '@/lib/admin/salesDashboardTypes'

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0)
}

export function resolveSalesDateRange(args: {
  endDate?: string | null
  preset?: SalesDashboardPreset | null
  startDate?: string | null
}): SalesDateRange {
  const now = new Date()
  const preset = args.preset ?? 'today'

  let start: Date
  let end: Date = endOfDay(now)

  if (preset === 'custom' && args.startDate && args.endDate) {
    start = startOfDay(new Date(args.startDate))
    end = endOfDay(new Date(args.endDate))
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      start = startOfDay(new Date(now.getTime() - 29 * 86400000))
      end = endOfDay(now)
    }
  } else if (preset === 'today') {
    start = startOfDay(now)
  } else if (preset === '2d') {
    start = startOfDay(new Date(now.getTime() - 1 * 86400000))
  } else if (preset === '7d') {
    start = startOfDay(new Date(now.getTime() - 6 * 86400000))
  } else if (preset === '15d') {
    start = startOfDay(new Date(now.getTime() - 14 * 86400000))
  } else if (preset === '30d') {
    start = startOfDay(new Date(now.getTime() - 29 * 86400000))
  } else if (preset === '90d') {
    start = startOfDay(new Date(now.getTime() - 89 * 86400000))
  } else if (preset === 'mtd') {
    start = startOfMonth(now)
  } else if (preset === 'ytd') {
    start = startOfYear(now)
  } else {
    start = startOfDay(new Date(now.getTime() - 29 * 86400000))
  }

  const spanMs = Math.max(end.getTime() - start.getTime(), 86400000)
  const previousEnd = new Date(start.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - spanMs)

  return {
    end: end.toISOString(),
    preset,
    previousEnd: previousEnd.toISOString(),
    previousStart: startOfDay(previousStart).toISOString(),
    start: start.toISOString(),
  }
}

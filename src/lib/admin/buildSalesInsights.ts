import type { SalesDashboardData, SalesInsight, SalesKpi } from '@/lib/admin/salesDashboardTypes'
import { formatBdtAmount } from '@/lib/notifications/priceDropCopy'

function formatDeltaShort(kpi: SalesKpi): string | null {
  if (kpi.deltaPercent === null) return null
  const sign = kpi.deltaPercent > 0 ? '+' : ''
  return `${sign}${kpi.deltaPercent}%`
}

export function buildSalesInsights(data: SalesDashboardData): SalesInsight[] {
  const insights: SalesInsight[] = []
  const { health, kpis, topCategoriesByRevenue, topBrandsByRevenue, ordersByDistrict } = data

  const revenueDelta = formatDeltaShort(kpis.revenue)
  if (revenueDelta) {
    insights.push({
      tone: kpis.revenue.deltaPercent! > 0 ? 'positive' : kpis.revenue.deltaPercent! < 0 ? 'negative' : 'neutral',
      message: `Revenue is ${revenueDelta} compared to the previous period (${formatBdtAmount(kpis.revenue.current)} vs ${formatBdtAmount(kpis.revenue.previous)}).`,
    })
  }

  if (health.cartConversionRate !== null) {
    const tone =
      health.cartConversionRate >= 35 ? 'positive'
      : health.cartConversionRate < 15 ? 'negative'
      : 'neutral'
    insights.push({
      tone,
      message: `Cart conversion is ${health.cartConversionRate}% (${data.carts.purchased} purchased vs ${data.carts.abandoned} abandoned carts in period).`,
    })
  }

  if (health.cancellationRate > 0) {
    insights.push({
      tone: health.cancellationRate > 10 ? 'negative' : 'neutral',
      message: `${health.cancellationRate}% of orders were cancelled or refunded (${formatBdtAmount(health.revenueAtRisk)} at risk).`,
    })
  }

  if (health.promoUsageRate > 0) {
    insights.push({
      tone: 'neutral',
      message: `${health.promoUsageRate}% of orders used a promo code (discounts total ${formatBdtAmount(kpis.promoDiscountTotal.current)}).`,
    })
  }

  if (health.repeatCustomerShare > 0 && health.uniqueCustomers > 0) {
    insights.push({
      tone: health.repeatCustomerShare >= 30 ? 'positive' : 'neutral',
      message: `${health.repeatCustomerShare}% of revenue came from repeat customers (${health.repeatCustomers} of ${health.uniqueCustomers} unique buyers ordered more than once).`,
    })
  }

  const topCategory = topCategoriesByRevenue[0]
  if (topCategory && topCategory.sharePercent >= 20) {
    insights.push({
      tone: 'neutral',
      message: `${topCategory.title} leads categories at ${topCategory.sharePercent}% of attributed revenue.`,
    })
  }

  const topBrand = topBrandsByRevenue[0]
  if (topBrand && topBrand.sharePercent >= 20) {
    insights.push({
      tone: 'neutral',
      message: `${topBrand.title} is the top brand at ${topBrand.sharePercent}% of attributed revenue.`,
    })
  }

  const topDistrict = ordersByDistrict[0]
  if (topDistrict && topDistrict.sharePercent >= 25) {
    insights.push({
      tone: 'neutral',
      message: `${topDistrict.district} accounts for ${topDistrict.sharePercent}% of order volume.`,
    })
  }

  const busiestDay = [...data.salesByDayOfWeek].sort((a, b) => b.revenue - a.revenue)[0]
  if (busiestDay && busiestDay.revenue > 0) {
    insights.push({
      tone: 'neutral',
      message: `${busiestDay.label} is the strongest day by revenue (${formatBdtAmount(busiestDay.revenue)}).`,
    })
  }

  if (data.pendingReviews > 0) {
    insights.push({
      tone: data.pendingReviews >= 10 ? 'negative' : 'neutral',
      message: `${data.pendingReviews} product reviews are waiting for moderation.`,
    })
  }

  if (data.lowStockProducts.length > 0) {
    insights.push({
      tone: 'negative',
      message: `${data.lowStockProducts.length} published products are at low stock (≤ 5 units).`,
    })
  }

  return insights.slice(0, 8)
}

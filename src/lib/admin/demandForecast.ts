import { callDeepSeekChat } from '@/lib/ai/deepseek'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import type { SalesDashboardData } from '@/lib/admin/salesDashboardTypes'

export type DemandForecastRow = {
  averageDailySales: number
  daysOfStockRemaining: number | null
  forecastNext7Days: number
  inventory: number
  productId: number
  productTitle: string
  variantId: number | null
}

export async function buildDemandForecast(args: {
  orderItems: { createdAt: string; productId: number; productTitle: string; quantity: number; variantId: number | null }[]
  inventoryByKey: Map<string, number>
  windowDays?: number
}): Promise<DemandForecastRow[]> {
  const windowDays = args.windowDays ?? 30
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const totals = new Map<string, { productId: number; productTitle: string; quantity: number; variantId: number | null }>()

  for (const item of args.orderItems) {
    if (new Date(item.createdAt).getTime() < cutoff) continue
    const key = `${item.productId}:${item.variantId ?? 'base'}`
    const existing = totals.get(key) ?? {
      productId: item.productId,
      productTitle: item.productTitle,
      quantity: 0,
      variantId: item.variantId,
    }
    existing.quantity += item.quantity
    totals.set(key, existing)
  }

  return [...totals.entries()].map(([key, row]) => {
    const averageDailySales = row.quantity / windowDays
    const inventory = args.inventoryByKey.get(key) ?? 0
    const daysOfStockRemaining =
      averageDailySales > 0 ? Math.round((inventory / averageDailySales) * 10) / 10 : null

    return {
      averageDailySales: Math.round(averageDailySales * 100) / 100,
      daysOfStockRemaining,
      forecastNext7Days: Math.round(averageDailySales * 7 * 100) / 100,
      inventory,
      productId: row.productId,
      productTitle: row.productTitle,
      variantId: row.variantId,
    }
  })
}

export async function generateDemandForecastNarrative(args: {
  forecast: DemandForecastRow[]
  salesData: SalesDashboardData
}): Promise<string | null> {
  if (!isAiShoppingAssistantEnabled()) return null

  const lowStock = args.forecast
    .filter((row) => row.daysOfStockRemaining !== null && row.daysOfStockRemaining <= 7)
    .slice(0, 8)

  if (!lowStock.length) return null

  const lines = lowStock
    .map(
      (row) =>
        `${row.productTitle}: ${row.inventory} in stock, ~${row.daysOfStockRemaining} days left, forecast ${row.forecastNext7Days} units/7d`,
    )
    .join('\n')

  const completion = await callDeepSeekChat({
    messages: [
      {
        role: 'system',
        content:
          'You are an ecommerce ops analyst. Write 3-5 bullet points with reorder recommendations based on the data. Plain text bullets only.',
      },
      {
        role: 'user',
        content: `Revenue current period: ${args.salesData.kpis.revenue.current}\nLow stock risk SKUs:\n${lines}`,
      },
    ],
    tools: false,
  })

  return completion.choices?.[0]?.message?.content?.trim() ?? null
}

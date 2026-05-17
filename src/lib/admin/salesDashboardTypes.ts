export type SalesDashboardPreset = 'today' | '2d' | '7d' | '15d' | '30d' | '90d' | 'mtd' | 'ytd' | 'custom'

export type SalesDateRange = {
  end: string
  preset: SalesDashboardPreset
  previousEnd: string
  previousStart: string
  start: string
}

export type SalesKpi = {
  current: number
  deltaPercent: number | null
  previous: number
}

export type SalesDashboardData = {
  range: SalesDateRange
  kpis: {
    averageOrderValue: SalesKpi
    newCustomers: SalesKpi
    orders: SalesKpi
    promoDiscountTotal: SalesKpi
    revenue: SalesKpi
  }
  revenueByDay: { date: string; orders: number; revenue: number }[]
  ordersByStatus: { count: number; status: string }[]
  paymentMethods: { count: number; method: string; revenue: number }[]
  topProductsByQuantity: {
    productId: number
    quantity: number
    revenue: number
    title: string
  }[]
  topProductsByRevenue: {
    productId: number
    quantity: number
    revenue: number
    title: string
  }[]
  topPromoCodes: {
    code: string
    discountTotal: number
    orders: number
  }[]
  recentOrders: {
    amount: number
    createdAt: string
    currency: string
    customerLabel: string
    id: number
    status: string | null
  }[]
  carts: {
    abandoned: number
    active: number
    purchased: number
  }
  lowStockProducts: {
    id: number
    inventory: number
    slug: string | null
    title: string
  }[]
  pendingReviews: number
}

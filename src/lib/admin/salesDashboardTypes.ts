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

export type SalesInsightTone = 'positive' | 'negative' | 'neutral'

export type SalesInsight = {
  message: string
  tone: SalesInsightTone
}

export type SalesHealthMetrics = {
  cancellationRate: number
  cartConversionRate: number | null
  grossRevenue: number
  promoUsageRate: number
  repeatCustomerShare: number
  repeatCustomers: number
  revenueAtRisk: number
  uniqueCustomers: number
}

export type SalesShippingDeliveryStats = {
  summary: {
    avgShippingPerOrder: number
    dhakaAreaShare: number
    freeDeliveryOrders: number
    homeDeliveryShare: number
    ordersWithShipping: number
    totalShippingRevenue: number
  }
  byDeliveryArea: {
    area: string
    count: number
    label: string
    sharePercent: number
  }[]
  byDeliveryType: {
    count: number
    label: string
    sharePercent: number
    type: string
  }[]
  byShipmentProfile: {
    name: string
    orders: number
    sharePercent: number
    shippingRevenue: number
  }[]
  fulfillment: {
    byCarrier: { carrier: string; count: number; label: string }[]
    completed: number
    delivered: number
    processing: number
    shipped: number
    withTracking: number
  }
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
  health: SalesHealthMetrics
  insights: SalesInsight[]
  revenueByDay: {
    averageOrderValue: number
    date: string
    orders: number
    promoDiscount: number
    revenue: number
  }[]
  previousRevenueByDay: {
    averageOrderValue: number
    date: string
    orders: number
    promoDiscount: number
    revenue: number
  }[]
  newCustomersByDay: { count: number; date: string }[]
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
  topCategoriesByRevenue: {
    categoryId: number
    quantity: number
    revenue: number
    sharePercent: number
    title: string
  }[]
  topBrandsByRevenue: {
    brandId: number
    quantity: number
    revenue: number
    sharePercent: number
    title: string
  }[]
  topCustomers: {
    customerId: number
    label: string
    orders: number
    revenue: number
  }[]
  ordersByDistrict: {
    count: number
    district: string
    revenue: number
    sharePercent: number
  }[]
  shippingDelivery: SalesShippingDeliveryStats
  salesByDayOfWeek: {
    day: number
    label: string
    orders: number
    revenue: number
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
  lowStockItems: {
    id: number
    inventory: number
    kind: 'product' | 'variant'
    productId: number
    productTitle: string
    reorderLevel: number
    title: string
    variantLabel?: string
  }[]
  funnel: {
    addToCart: number
    beginCheckout: number
    cartConversionRate: number | null
    productViews: number
    purchase: number
    viewToCartRate: number | null
    viewToPurchaseRate: number | null
  }
  recentQuoteRequests: {
    companyName: string
    contactName: string
    createdAt: string
    id: number
    productTitle: string
    quantity: number
    status: string
  }[]
  pendingReviews: number
  openQuoteRequests: number
  demandForecast: {
    averageDailySales: number
    daysOfStockRemaining: number | null
    forecastNext7Days: number
    inventory: number
    productId: number
    productTitle: string
    variantId: number | null
  }[]
  aiDemandNarrative: string | null
}

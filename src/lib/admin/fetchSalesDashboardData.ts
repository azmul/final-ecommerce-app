import { fetchFunnelMetrics } from '@/lib/analytics/fetchFunnelMetrics'
import { buildDemandForecast, generateDemandForecastNarrative } from '@/lib/admin/demandForecast'
import { buildSalesInsights } from '@/lib/admin/buildSalesInsights'
import { fetchLowStockItems } from '@/lib/inventory/fetchLowStockItems'
import { buildDateRangeWhere, mergeWhere } from '@/lib/admin/buildDateRangeWhere'
import type {
  SalesDashboardData,
  SalesHealthMetrics,
  SalesKpi,
  SalesShippingDeliveryStats,
} from '@/lib/admin/salesDashboardTypes'
import { resolveSalesDateRange } from '@/lib/admin/resolveSalesDateRange'
import { districtToDeliveryArea } from '@/lib/shipping/customerDeliveryPrefs'
import type { Brand, Category, Order, Product, Transaction, User } from '@/payload-types'
import type { Payload, Where } from 'payload'

const EXCLUDED_REVENUE_STATUSES = new Set(['cancelled', 'refunded'])
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const PAGE = 500

function resolveId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

function kpi(current: number, previous: number): SalesKpi {
  const deltaPercent =
    previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10
    : current > 0 ?
      100
    : null
  return { current, deltaPercent, previous }
}

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

async function fetchAllOrders(payload: Payload, where: Where): Promise<Order[]> {
  const docs: Order[] = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const res = await payload.find({
      collection: 'orders',
      depth: 1,
      limit: PAGE,
      overrideAccess: true,
      page,
      pagination: true,
      sort: '-createdAt',
      where,
    })
    docs.push(...(res.docs as Order[]))
    hasNext = res.hasNextPage === true
    page += 1
    if (page > 40) break
  }

  return docs
}

async function customersByDayInRange(
  payload: Payload,
  start: string,
  end: string,
): Promise<{ count: number; date: string }[]> {
  const res = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    where: buildDateRangeWhere('createdAt', start, end),
  })

  const dayMap = new Map<string, number>()

  for (const doc of res.docs) {
    const roles = (doc as User).roles
    if (!Array.isArray(roles) || !roles.includes('customer')) continue
    const dk = dateKey(doc.createdAt)
    dayMap.set(dk, (dayMap.get(dk) ?? 0) + 1)
  }

  return [...dayMap.entries()]
    .map(([date, count]) => ({ count, date }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function countCustomersInRange(
  payload: Payload,
  start: string,
  end: string,
): Promise<{ totalDocs: number }> {
  const res = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    where: buildDateRangeWhere('createdAt', start, end),
  })

  const count = res.docs.filter((doc) => {
    const roles = (doc as User).roles
    return Array.isArray(roles) && roles.includes('customer')
  }).length

  return { totalDocs: count }
}

async function fetchAllTransactions(payload: Payload, where: Where): Promise<Transaction[]> {
  const docs: Transaction[] = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const res = await payload.find({
      collection: 'transactions',
      depth: 0,
      limit: PAGE,
      overrideAccess: true,
      page,
      pagination: true,
      sort: '-createdAt',
      where,
    })
    docs.push(...(res.docs as Transaction[]))
    hasNext = res.hasNextPage === true
    page += 1
    if (page > 40) break
  }

  return docs
}

function orderRevenue(order: Order): number {
  if (order.status && EXCLUDED_REVENUE_STATUSES.has(order.status)) return 0
  return typeof order.amount === 'number' && Number.isFinite(order.amount) ? order.amount : 0
}

function orderAmount(order: Order): number {
  return typeof order.amount === 'number' && Number.isFinite(order.amount) ? order.amount : 0
}

function resolveCategory(category: number | Category): { id: number; title: string } | null {
  if (typeof category === 'number') return { id: category, title: `Category #${category}` }
  if (category && typeof category === 'object' && 'id' in category) {
    return {
      id: category.id,
      title: typeof category.title === 'string' ? category.title : `Category #${category.id}`,
    }
  }
  return null
}

function resolveBrand(brand: number | Brand | null | undefined): { id: number; title: string } | null {
  if (brand == null) return null
  if (typeof brand === 'number') return { id: brand, title: `Brand #${brand}` }
  if (typeof brand === 'object' && 'id' in brand) {
    return {
      id: brand.id,
      title: typeof brand.title === 'string' ? brand.title : `Brand #${brand.id}`,
    }
  }
  return null
}

function customerLabel(order: Order): string {
  const customer = order.customer
  if (typeof order.customerEmail === 'string' && order.customerEmail) return order.customerEmail
  if (customer && typeof customer === 'object') {
    return String(customer.name ?? customer.email ?? `User #${customer.id}`)
  }
  return order.customerFullName ?? 'Guest'
}

function withSharePercent<T extends { revenue: number }>(
  rows: T[],
  totalRevenue: number,
): (T & { sharePercent: number })[] {
  return rows.map((row) => ({
    ...row,
    sharePercent: totalRevenue > 0 ? Math.round((row.revenue / totalRevenue) * 1000) / 10 : 0,
  }))
}

function aggregateOrders(orders: Order[]) {
  let revenue = 0
  let grossRevenue = 0
  let revenueAtRisk = 0
  let promoDiscount = 0
  let promoOrderCount = 0
  let cancelledOrRefunded = 0
  const statusCounts = new Map<string, number>()
  const promoMap = new Map<string, { code: string; discountTotal: number; orders: number }>()
  const productQty = new Map<number, { title: string; quantity: number; revenue: number }>()
  const categoryMap = new Map<number, { title: string; quantity: number; revenue: number }>()
  const brandMap = new Map<number, { title: string; quantity: number; revenue: number }>()
  const districtMap = new Map<string, { count: number; district: string; revenue: number }>()
  const customerMap = new Map<number, { customerId: number; label: string; orders: number; revenue: number }>()
  const dayOfWeekMap = new Map<number, { day: number; label: string; orders: number; revenue: number }>()
  const dayMap = new Map<
    string,
    { averageOrderValue: number; date: string; orders: number; promoDiscount: number; revenue: number }
  >()

  for (const order of orders) {
    const amount = orderAmount(order)
    grossRevenue += amount

    const rev = orderRevenue(order)
    revenue += rev

    const status = order.status ?? 'unknown'
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)

    if (status === 'cancelled' || status === 'refunded') {
      cancelledOrRefunded += 1
      revenueAtRisk += amount
    }

    const dk = dateKey(order.createdAt)
    const day =
      dayMap.get(dk) ?? { averageOrderValue: 0, date: dk, orders: 0, promoDiscount: 0, revenue: 0 }
    day.orders += 1
    day.revenue += rev
    dayMap.set(dk, day)

    const dow = new Date(order.createdAt).getUTCDay()
    const dowRow = dayOfWeekMap.get(dow) ?? {
      day: dow,
      label: DAY_LABELS[dow] ?? 'Unknown',
      orders: 0,
      revenue: 0,
    }
    dowRow.orders += 1
    dowRow.revenue += rev
    dayOfWeekMap.set(dow, dowRow)

    const district =
      typeof order.shippingAddress?.district === 'string' && order.shippingAddress.district.trim() ?
        order.shippingAddress.district.trim()
      : 'Unknown'
    const districtRow = districtMap.get(district) ?? { district, count: 0, revenue: 0 }
    districtRow.count += 1
    districtRow.revenue += rev
    districtMap.set(district, districtRow)

    const customerId = resolveId(order.customer)
    if (customerId != null) {
      const row = customerMap.get(customerId) ?? {
        customerId,
        label: customerLabel(order),
        orders: 0,
        revenue: 0,
      }
      row.orders += 1
      row.revenue += rev
      customerMap.set(customerId, row)
    }

    const discount =
      typeof order.promoDiscountAmount === 'number' ? order.promoDiscountAmount : 0
    if (discount > 0) {
      promoOrderCount += 1
      const dayRow = dayMap.get(dk)
      if (dayRow) dayRow.promoDiscount += discount
      promoDiscount += discount
      const code =
        typeof order.appliedPromoCode === 'string' && order.appliedPromoCode ?
          order.appliedPromoCode
        : '—'
      const row = promoMap.get(code) ?? { code, discountTotal: 0, orders: 0 }
      row.discountTotal += discount
      row.orders += 1
      promoMap.set(code, row)
    }

    const items = Array.isArray(order.items) ? order.items : []
    const orderRev = rev
    const itemCount = items.reduce((s, i) => s + (typeof i.quantity === 'number' ? i.quantity : 0), 0) || 1

    for (const item of items) {
      const productId = resolveId(item.product)
      const qty = typeof item.quantity === 'number' ? item.quantity : 0
      if (productId == null || qty <= 0) continue

      const product = item.product
      const title =
        product && typeof product === 'object' && 'title' in product ?
          String((product as Product).title ?? `Product #${productId}`)
        : `Product #${productId}`

      const lineRev = Math.round((orderRev * qty) / itemCount)
      const row = productQty.get(productId) ?? { title, quantity: 0, revenue: 0 }
      row.quantity += qty
      row.revenue += lineRev
      productQty.set(productId, row)

      if (product && typeof product === 'object') {
        const categories = Array.isArray((product as Product).categories) ?
          (product as Product).categories!
        : []
        const catCount = categories.length || 1
        const catShare = Math.round(lineRev / catCount)

        for (const category of categories) {
          const resolved = resolveCategory(category as number | Category)
          if (!resolved) continue
          const catRow = categoryMap.get(resolved.id) ?? {
            title: resolved.title,
            quantity: 0,
            revenue: 0,
          }
          catRow.quantity += qty
          catRow.revenue += catShare
          categoryMap.set(resolved.id, catRow)
        }

        const brand = resolveBrand((product as Product).brand)
        if (brand) {
          const brandRow = brandMap.get(brand.id) ?? { title: brand.title, quantity: 0, revenue: 0 }
          brandRow.quantity += qty
          brandRow.revenue += lineRev
          brandMap.set(brand.id, brandRow)
        }
      }
    }
  }

  const ordersCount = orders.length
  const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0
  const uniqueCustomers = customerMap.size
  let repeatCustomers = 0
  let repeatCustomerRevenue = 0

  for (const row of customerMap.values()) {
    if (row.orders > 1) {
      repeatCustomers += 1
      repeatCustomerRevenue += row.revenue
    }
  }

  const topProductsByRevenue = [...productQty.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const topProductsByQuantity = [...productQty.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  const topCategoriesByRevenue = withSharePercent(
    [...categoryMap.entries()]
      .map(([categoryId, v]) => ({ categoryId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    revenue,
  )

  const topBrandsByRevenue = withSharePercent(
    [...brandMap.entries()]
      .map(([brandId, v]) => ({ brandId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    revenue,
  )

  const topCustomers = [...customerMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  const ordersByDistrict = withSharePercent(
    [...districtMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    revenue,
  ).map((row) => ({
    ...row,
    sharePercent:
      ordersCount > 0 ? Math.round((row.count / ordersCount) * 1000) / 10 : row.sharePercent,
  }))

  const salesByDayOfWeek = [...dayOfWeekMap.values()].sort((a, b) => a.day - b.day)

  const topPromoCodes = [...promoMap.values()].sort((a, b) => b.discountTotal - a.discountTotal).slice(0, 8)

  const ordersByStatus = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  const revenueByDay = [...dayMap.values()]
    .map((day) => ({
      ...day,
      averageOrderValue: day.orders > 0 ? Math.round(day.revenue / day.orders) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    aov,
    cancelledOrRefunded,
    grossRevenue,
    ordersCount,
    ordersByDistrict,
    ordersByStatus,
    promoDiscount,
    promoOrderCount,
    repeatCustomerRevenue,
    repeatCustomers,
    revenue,
    revenueAtRisk,
    revenueByDay,
    salesByDayOfWeek,
    topBrandsByRevenue,
    topCategoriesByRevenue,
    topCustomers,
    topProductsByQuantity,
    topProductsByRevenue,
    topPromoCodes,
    uniqueCustomers,
  }
}

function computeHealth(args: {
  cancelledOrRefunded: number
  carts: { abandoned: number; purchased: number }
  grossRevenue: number
  ordersCount: number
  promoOrderCount: number
  repeatCustomerRevenue: number
  repeatCustomers: number
  revenue: number
  revenueAtRisk: number
  uniqueCustomers: number
}): SalesHealthMetrics {
  const cartDenom = args.carts.purchased + args.carts.abandoned
  return {
    cancellationRate:
      args.ordersCount > 0 ?
        Math.round((args.cancelledOrRefunded / args.ordersCount) * 1000) / 10
      : 0,
    cartConversionRate:
      cartDenom > 0 ? Math.round((args.carts.purchased / cartDenom) * 1000) / 10 : null,
    grossRevenue: args.grossRevenue,
    promoUsageRate:
      args.ordersCount > 0 ?
        Math.round((args.promoOrderCount / args.ordersCount) * 1000) / 10
      : 0,
    repeatCustomerShare:
      args.revenue > 0 ?
        Math.round((args.repeatCustomerRevenue / args.revenue) * 1000) / 10
      : 0,
    repeatCustomers: args.repeatCustomers,
    revenueAtRisk: args.revenueAtRisk,
    uniqueCustomers: args.uniqueCustomers,
  }
}

const CARRIER_LABELS: Record<string, string> = {
  manual: 'Manual / Other',
  pathao: 'Pathao',
  redx: 'RedX',
  steadfast: 'Steadfast',
}

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  home: 'Home delivery',
  point: 'Point delivery',
}

const DELIVERY_AREA_LABELS: Record<string, string> = {
  dhaka: 'Dhaka zone',
  outside_dhaka: 'Outside Dhaka',
}

function recordFromUnknown(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ?
      (value as Record<string, unknown>)
    : null
}

function shippingFromOrder(order: Order): {
  area: string | null
  deliveryType: string | null
  freeDelivery: boolean
  shipmentName: string | null
  shippingBdt: number
} {
  const summary = recordFromUnknown(order.checkoutShipmentSummary)
  const prefs = summary ? recordFromUnknown(summary.deliveryPrefs) : null
  const group = summary ? recordFromUnknown(summary.shipmentGroup) : null

  const deliveryType =
    typeof prefs?.deliveryType === 'string' ? prefs.deliveryType
    : null
  const area =
    typeof prefs?.area === 'string' ? prefs.area
    : districtToDeliveryArea(order.shippingAddress?.district)

  const shippingFromGroup =
    typeof group?.shippingTotalBdt === 'number' && Number.isFinite(group.shippingTotalBdt) ?
      group.shippingTotalBdt
    : 0

  const shipmentName =
    typeof group?.shipmentName === 'string' && group.shipmentName.trim() ?
      group.shipmentName.trim()
    : typeof order.shipmentName === 'string' && order.shipmentName.trim() ?
      order.shipmentName.trim()
    : null

  const freeDelivery = shippingFromGroup <= 0

  return {
    area,
    deliveryType,
    freeDelivery,
    shipmentName,
    shippingBdt: shippingFromGroup,
  }
}

function aggregateShippingDeliveryStats(orders: Order[]): SalesShippingDeliveryStats {
  const revenueOrders = orders.filter(
    (order) => !order.status || !EXCLUDED_REVENUE_STATUSES.has(order.status),
  )

  let totalShippingRevenue = 0
  let ordersWithShipping = 0
  let freeDeliveryOrders = 0
  let homeDeliveryCount = 0
  let dhakaAreaCount = 0
  let classifiedOrders = 0

  const typeMap = new Map<string, { count: number; label: string; type: string }>()
  const areaMap = new Map<string, { area: string; count: number; label: string }>()
  const profileMap = new Map<
    string,
    { name: string; orders: number; shippingRevenue: number }
  >()

  let processing = 0
  let shipped = 0
  let delivered = 0
  let completed = 0
  let withTracking = 0
  const carrierMap = new Map<string, { carrier: string; count: number; label: string }>()

  for (const order of revenueOrders) {
    const shipping = shippingFromOrder(order)
    totalShippingRevenue += shipping.shippingBdt

    if (shipping.shippingBdt > 0) ordersWithShipping += 1
    if (shipping.freeDelivery) freeDeliveryOrders += 1

    classifiedOrders += 1

    if (shipping.deliveryType === 'home') homeDeliveryCount += 1

    const areaKey = shipping.area ?? 'unknown'
    if (areaKey === 'dhaka') dhakaAreaCount += 1

    if (shipping.deliveryType) {
      const typeKey = shipping.deliveryType
      const row = typeMap.get(typeKey) ?? {
        count: 0,
        label: DELIVERY_TYPE_LABELS[typeKey] ?? typeKey,
        type: typeKey,
      }
      row.count += 1
      typeMap.set(typeKey, row)
    }

    const areaLabel = DELIVERY_AREA_LABELS[areaKey] ?? areaKey
    const areaRow = areaMap.get(areaKey) ?? { area: areaKey, count: 0, label: areaLabel }
    areaRow.count += 1
    areaMap.set(areaKey, areaRow)

    const profileName = shipping.shipmentName ?? 'Unassigned profile'
    const profileRow = profileMap.get(profileName) ?? {
      name: profileName,
      orders: 0,
      shippingRevenue: 0,
    }
    profileRow.orders += 1
    profileRow.shippingRevenue += shipping.shippingBdt
    profileMap.set(profileName, profileRow)

    const status = String(order.status ?? '')
    if (status === 'processing') processing += 1
    if (status === 'shipped' || order.fulfillment?.shippedAt) shipped += 1
    if (status === 'delivered') delivered += 1
    if (status === 'completed') completed += 1

    const tracking = order.fulfillment?.trackingNumber
    if (typeof tracking === 'string' && tracking.trim()) withTracking += 1

    const carrier = order.fulfillment?.carrier
    if (typeof carrier === 'string' && carrier) {
      const carrierRow = carrierMap.get(carrier) ?? {
        carrier,
        count: 0,
        label: CARRIER_LABELS[carrier] ?? carrier,
      }
      carrierRow.count += 1
      carrierMap.set(carrier, carrierRow)
    }
  }

  const share = (count: number) =>
    classifiedOrders > 0 ? Math.round((count / classifiedOrders) * 1000) / 10 : 0

  const byDeliveryType = [...typeMap.values()]
    .map((row) => ({ ...row, sharePercent: share(row.count) }))
    .sort((a, b) => b.count - a.count)

  const byDeliveryArea = [...areaMap.values()]
    .map((row) => ({ ...row, sharePercent: share(row.count) }))
    .sort((a, b) => b.count - a.count)

  const byShipmentProfile = [...profileMap.values()]
    .map((row) => ({
      ...row,
      sharePercent: share(row.orders),
    }))
    .sort((a, b) => b.shippingRevenue - a.shippingRevenue)
    .slice(0, 8)

  return {
    summary: {
      avgShippingPerOrder:
        classifiedOrders > 0 ? Math.round(totalShippingRevenue / classifiedOrders) : 0,
      dhakaAreaShare: share(dhakaAreaCount),
      freeDeliveryOrders,
      homeDeliveryShare: share(homeDeliveryCount),
      ordersWithShipping,
      totalShippingRevenue,
    },
    byDeliveryArea,
    byDeliveryType,
    byShipmentProfile,
    fulfillment: {
      byCarrier: [...carrierMap.values()].sort((a, b) => b.count - a.count),
      completed,
      delivered,
      processing,
      shipped,
      withTracking,
    },
  }
}

function aggregateTransactions(transactions: Transaction[]) {
  const map = new Map<string, { count: number; method: string; revenue: number }>()

  for (const tx of transactions) {
    if (tx.status !== 'succeeded') continue
    const method = tx.paymentMethod ?? 'unknown'
    const amount = typeof tx.amount === 'number' ? tx.amount : 0
    const row = map.get(method) ?? { method, count: 0, revenue: 0 }
    row.count += 1
    row.revenue += amount
    map.set(method, row)
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

export async function fetchSalesDashboardData(args: {
  payload: Payload
  preset?: string | null
  startDate?: string | null
  endDate?: string | null
}): Promise<SalesDashboardData> {
  const range = resolveSalesDateRange({
    endDate: args.endDate,
    preset: (args.preset as SalesDashboardData['range']['preset']) ?? 'today',
    startDate: args.startDate,
  })

  const currentWhere = buildDateRangeWhere('createdAt', range.start, range.end)
  const previousWhere = buildDateRangeWhere('createdAt', range.previousStart, range.previousEnd)
  const cartUpdatedWhere = buildDateRangeWhere('updatedAt', range.start, range.end)

  const [
    currentOrders,
    previousOrders,
    transactions,
    recentOrdersRes,
    currentUsersRes,
    previousUsersRes,
    cartsRes,
    reviewsRes,
    newCustomersByDay,
    quoteRequestsRes,
    openQuoteRequestsRes,
  ] = await Promise.all([
      fetchAllOrders(args.payload, currentWhere),
      fetchAllOrders(args.payload, previousWhere),
      fetchAllTransactions(args.payload, currentWhere),
      args.payload.find({
        collection: 'orders',
        depth: 1,
        limit: 10,
        overrideAccess: true,
        sort: '-createdAt',
        where: currentWhere,
      }),
      countCustomersInRange(args.payload, range.start, range.end),
      countCustomersInRange(args.payload, range.previousStart, range.previousEnd),
      args.payload.count({
        collection: 'carts',
        overrideAccess: true,
        where: mergeWhere(cartUpdatedWhere, { subtotal: { greater_than: 0 } }),
      }),
      args.payload.count({
        collection: 'product-reviews',
        overrideAccess: true,
        where: { moderationStatus: { equals: 'pending' } },
      }),
      customersByDayInRange(args.payload, range.start, range.end),
      args.payload.find({
        collection: 'quote-requests',
        depth: 1,
        limit: 8,
        overrideAccess: true,
        sort: '-createdAt',
        where: buildDateRangeWhere('createdAt', range.start, range.end),
      }),
      args.payload.count({
        collection: 'quote-requests',
        overrideAccess: true,
        where: {
          status: { in: ['new', 'in_review'] },
        },
      }),
    ])

  const [lowStockItems, funnel] = await Promise.all([
    fetchLowStockItems(args.payload),
    fetchFunnelMetrics(args.payload, buildDateRangeWhere('createdAt', range.start, range.end)),
  ])

  const current = aggregateOrders(currentOrders)
  const previous = aggregateOrders(previousOrders)

  const [purchasedCarts, abandonedCarts] = await Promise.all([
    args.payload.count({
      collection: 'carts',
      overrideAccess: true,
      where: mergeWhere(cartUpdatedWhere, { purchasedAt: { exists: true } }),
    }),
    args.payload.count({
      collection: 'carts',
      overrideAccess: true,
      where: mergeWhere(
        cartUpdatedWhere,
        { purchasedAt: { equals: null } },
        { subtotal: { greater_than: 0 } },
      ),
    }),
  ])

  const recentOrders = (recentOrdersRes.docs as Order[]).map((order) => {
    const customer = order.customer as User | number | null | undefined
    const customerLabel =
      typeof order.customerEmail === 'string' && order.customerEmail ?
        order.customerEmail
      : customer && typeof customer === 'object' ?
        (customer.name ?? customer.email ?? `User #${customer.id}`)
      : order.customerFullName ?? `Order #${order.id}`

    return {
      amount: typeof order.amount === 'number' ? order.amount : 0,
      createdAt: order.createdAt,
      currency: order.currency ?? 'BDT',
      customerLabel: String(customerLabel),
      id: order.id,
      status: order.status ?? null,
    }
  })

  const recentQuoteRequests = quoteRequestsRes.docs.map((quote) => {
    const product = quote.product
    const productTitle =
      product && typeof product === 'object' && typeof product.title === 'string' ?
        product.title
      : `Product #${typeof product === 'object' && product ? product.id : quote.product}`

    return {
      companyName: typeof quote.companyName === 'string' ? quote.companyName : '—',
      contactName: typeof quote.contactName === 'string' ? quote.contactName : '—',
      createdAt: quote.createdAt,
      id: quote.id,
      productTitle,
      quantity: typeof quote.quantity === 'number' ? quote.quantity : 0,
      status: typeof quote.status === 'string' ? quote.status : 'new',
    }
  })

  const carts = {
    active: cartsRes.totalDocs,
    purchased: purchasedCarts.totalDocs,
    abandoned: abandonedCarts.totalDocs,
  }

  const health = computeHealth({
    cancelledOrRefunded: current.cancelledOrRefunded,
    carts,
    grossRevenue: current.grossRevenue,
    ordersCount: current.ordersCount,
    promoOrderCount: current.promoOrderCount,
    repeatCustomerRevenue: current.repeatCustomerRevenue,
    repeatCustomers: current.repeatCustomers,
    revenue: current.revenue,
    revenueAtRisk: current.revenueAtRisk,
    uniqueCustomers: current.uniqueCustomers,
  })

  const dashboard: SalesDashboardData = {
    range,
    kpis: {
      revenue: kpi(current.revenue, previous.revenue),
      orders: kpi(current.ordersCount, previous.ordersCount),
      averageOrderValue: kpi(current.aov, previous.aov),
      promoDiscountTotal: kpi(current.promoDiscount, previous.promoDiscount),
      newCustomers: kpi(currentUsersRes.totalDocs, previousUsersRes.totalDocs),
    },
    health,
    insights: [],
    revenueByDay: current.revenueByDay,
    previousRevenueByDay: previous.revenueByDay,
    newCustomersByDay,
    ordersByStatus: current.ordersByStatus,
    paymentMethods: aggregateTransactions(transactions),
    topProductsByQuantity: current.topProductsByQuantity,
    topProductsByRevenue: current.topProductsByRevenue,
    topCategoriesByRevenue: current.topCategoriesByRevenue,
    topBrandsByRevenue: current.topBrandsByRevenue,
    topCustomers: current.topCustomers,
    ordersByDistrict: current.ordersByDistrict,
    shippingDelivery: aggregateShippingDeliveryStats(currentOrders),
    salesByDayOfWeek: current.salesByDayOfWeek,
    topPromoCodes: current.topPromoCodes,
    recentOrders,
    carts,
    lowStockItems,
    funnel,
    recentQuoteRequests,
    pendingReviews: reviewsRes.totalDocs,
    openQuoteRequests: openQuoteRequestsRes.totalDocs,
    demandForecast: [],
    aiDemandNarrative: null,
  }

  dashboard.insights = buildSalesInsights(dashboard)

  const orderItems = currentOrders.flatMap((order) =>
    (order.items ?? []).map((item) => {
      const product = item.product
      const productId = resolveId(product) ?? 0
      const productTitle =
        product && typeof product === 'object' && typeof product.title === 'string' ?
          product.title
        : `Product #${productId}`

      return {
        createdAt: order.createdAt,
        productId,
        productTitle,
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        variantId: resolveId(item.variant),
      }
    }),
  )

  const inventoryByKey = new Map<string, number>()
  for (const row of lowStockItems) {
    const key = `${row.productId}:${row.kind === 'variant' ? row.id : 'base'}`
    inventoryByKey.set(key, row.inventory)
  }

  dashboard.demandForecast = await buildDemandForecast({ orderItems, inventoryByKey })
  dashboard.aiDemandNarrative = await generateDemandForecastNarrative({
    forecast: dashboard.demandForecast,
    salesData: dashboard,
  })

  return dashboard
}

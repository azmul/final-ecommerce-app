import { buildDateRangeWhere, mergeWhere } from '@/lib/admin/buildDateRangeWhere'
import type { SalesDashboardData, SalesKpi } from '@/lib/admin/salesDashboardTypes'
import { resolveSalesDateRange } from '@/lib/admin/resolveSalesDateRange'
import type { Order, Product, Transaction, User } from '@/payload-types'
import type { Payload, Where } from 'payload'

const EXCLUDED_REVENUE_STATUSES = new Set(['cancelled', 'refunded'])
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

function aggregateOrders(orders: Order[]) {
  let revenue = 0
  let promoDiscount = 0
  const statusCounts = new Map<string, number>()
  const promoMap = new Map<string, { code: string; discountTotal: number; orders: number }>()
  const productQty = new Map<number, { title: string; quantity: number; revenue: number }>()
  const dayMap = new Map<string, { date: string; orders: number; revenue: number }>()

  for (const order of orders) {
    const rev = orderRevenue(order)
    revenue += rev

    const status = order.status ?? 'unknown'
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)

    const dk = dateKey(order.createdAt)
    const day = dayMap.get(dk) ?? { date: dk, orders: 0, revenue: 0 }
    day.orders += 1
    day.revenue += rev
    dayMap.set(dk, day)

    const discount =
      typeof order.promoDiscountAmount === 'number' ? order.promoDiscountAmount : 0
    if (discount > 0) {
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
    }
  }

  const ordersCount = orders.length
  const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0

  const topProductsByRevenue = [...productQty.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const topProductsByQuantity = [...productQty.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  const topPromoCodes = [...promoMap.values()].sort((a, b) => b.discountTotal - a.discountTotal).slice(0, 8)

  const ordersByStatus = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  const revenueByDay = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date))

  return {
    aov,
    ordersCount,
    ordersByStatus,
    promoDiscount,
    revenue,
    revenueByDay,
    topProductsByQuantity,
    topProductsByRevenue,
    topPromoCodes,
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
    productsRes,
    reviewsRes,
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
      args.payload.find({
        collection: 'products',
        depth: 0,
        limit: 15,
        overrideAccess: true,
        pagination: false,
        sort: 'inventory',
        where: mergeWhere(
          { _status: { equals: 'published' } },
          { enableVariants: { equals: false } },
          { inventory: { less_than_equal: 5 } },
        ),
      }),
      args.payload.count({
        collection: 'product-reviews',
        overrideAccess: true,
        where: { moderationStatus: { equals: 'pending' } },
      }),
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

  const lowStockProducts = (productsRes.docs as Product[])
    .filter((p) => typeof p.inventory === 'number' && p.inventory <= 5)
    .map((p) => ({
      id: p.id,
      inventory: p.inventory ?? 0,
      slug: typeof p.slug === 'string' ? p.slug : null,
      title: typeof p.title === 'string' ? p.title : `Product #${p.id}`,
    }))

  return {
    range,
    kpis: {
      revenue: kpi(current.revenue, previous.revenue),
      orders: kpi(current.ordersCount, previous.ordersCount),
      averageOrderValue: kpi(current.aov, previous.aov),
      promoDiscountTotal: kpi(current.promoDiscount, previous.promoDiscount),
      newCustomers: kpi(currentUsersRes.totalDocs, previousUsersRes.totalDocs),
    },
    revenueByDay: current.revenueByDay,
    ordersByStatus: current.ordersByStatus,
    paymentMethods: aggregateTransactions(transactions),
    topProductsByQuantity: current.topProductsByQuantity,
    topProductsByRevenue: current.topProductsByRevenue,
    topPromoCodes: current.topPromoCodes,
    recentOrders,
    carts: {
      active: cartsRes.totalDocs,
      purchased: purchasedCarts.totalDocs,
      abandoned: abandonedCarts.totalDocs,
    },
    lowStockProducts,
    pendingReviews: reviewsRes.totalDocs,
  }
}

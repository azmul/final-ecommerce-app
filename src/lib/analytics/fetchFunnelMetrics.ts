import type { Payload } from 'payload'
import type { Where } from 'payload'

export type FunnelMetrics = {
  addToCart: number
  beginCheckout: number
  cartConversionRate: number | null
  productViews: number
  purchase: number
  viewToCartRate: number | null
  viewToPurchaseRate: number | null
}

export async function fetchFunnelMetrics(
  payload: Payload,
  where: Where,
): Promise<FunnelMetrics> {
  const [productViews, addToCart, beginCheckout, purchase] = await Promise.all([
    payload.count({
      collection: 'analytics-events',
      overrideAccess: true,
      where: { and: [where, { eventType: { equals: 'product_view' } }] },
    }),
    payload.count({
      collection: 'analytics-events',
      overrideAccess: true,
      where: { and: [where, { eventType: { equals: 'add_to_cart' } }] },
    }),
    payload.count({
      collection: 'analytics-events',
      overrideAccess: true,
      where: { and: [where, { eventType: { equals: 'begin_checkout' } }] },
    }),
    payload.count({
      collection: 'analytics-events',
      overrideAccess: true,
      where: { and: [where, { eventType: { equals: 'purchase' } }] },
    }),
  ])

  const productViewCount = productViews.totalDocs
  const addToCartCount = addToCart.totalDocs
  const beginCheckoutCount = beginCheckout.totalDocs
  const purchaseCount = purchase.totalDocs

  const pct = (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 1000) / 10 : null

  return {
    addToCart: addToCartCount,
    beginCheckout: beginCheckoutCount,
    cartConversionRate: pct(purchaseCount, beginCheckoutCount),
    productViews: productViewCount,
    purchase: purchaseCount,
    viewToCartRate: pct(addToCartCount, productViewCount),
    viewToPurchaseRate: pct(purchaseCount, productViewCount),
  }
}

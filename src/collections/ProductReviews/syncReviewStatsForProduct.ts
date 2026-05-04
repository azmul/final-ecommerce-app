import type { Payload, PayloadRequest } from 'payload'

/**
 * Keeps aggregate stars on products in sync with **approved** reviews only.
 */
export async function syncReviewStatsForProduct(
  payload: Payload,
  req: PayloadRequest | undefined,
  productId: number | string,
): Promise<void> {
  if (!req) return

  let page = 1
  let sum = 0
  let count = 0

  // Paginate — hooks must stay resilient for large catalogs
  while (page < 500) {
    const result = await payload.find({
      collection: 'product-reviews',
      depth: 0,
      limit: 200,
      overrideAccess: true,
      page,
      pagination: true,
      req,
      sort: '-createdAt',
      where: {
        and: [
          {
            product: {
              equals: productId,
            },
          },
          {
            moderationStatus: {
              equals: 'approved',
            },
          },
        ],
      },
    })

    for (const doc of result.docs) {
      sum += typeof doc.rating === 'number' ? doc.rating : 0
      count += 1
    }

    if (!result.hasNextPage) break
    page += 1
  }

  const average = count > 0 ? Math.round((sum / count) * 100) / 100 : null

  await payload.update({
    collection: 'products',
    data: {
      reviewAverageRating: average,
      reviewCount: count,
    },
    depth: 0,
    id: productId,
    overrideAccess: true,
    req,
  })
}

import type { Payload, PayloadRequest } from 'payload'

/**
 * True when this customer appears on a completed order line with the given product id.
 */
export async function customerHasPurchasedProduct(
  payload: Payload,
  req: PayloadRequest | undefined,
  customerId: number | string,
  productId: number | string,
): Promise<boolean> {
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          customer: {
            equals: customerId,
          },
        },
        {
          status: {
            equals: 'completed',
          },
        },
        {
          'items.product': {
            equals: productId,
          },
        },
      ],
    },
  })

  return docs.length > 0
}

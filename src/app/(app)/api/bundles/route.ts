import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const productId = Number(url.searchParams.get('productId'))
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'product-bundles',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    where: { active: { equals: true } },
  })

  const docs = productId && Number.isFinite(productId) ?
      result.docs.filter((bundle) => {
        const items = Array.isArray(bundle.items) ? bundle.items : []
        return items.some((line) => {
          const pid =
            typeof line.product === 'object' && line.product ?
              line.product.id
            : line.product
          return Number(pid) === productId
        })
      })
    : result.docs

  return NextResponse.json({ docs })
}

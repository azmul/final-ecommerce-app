import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const idsParam = url.searchParams.get('ids') ?? ''
  const ids = idsParam
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value))
    // Cap the batch so a request with thousands of ids can't drive one huge query.
    .slice(0, 100)

  if (!ids.length) {
    return NextResponse.json(
      { products: [] },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    )
  }

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'products',
    depth: 2,
    limit: ids.length,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { id: { in: ids } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  const byId = new Map(docs.map((doc) => [doc.id, doc]))
  const ordered = ids.flatMap((id) => {
    const doc = byId.get(id)
    return doc ? [doc] : []
  })

  return NextResponse.json(
    { products: ordered },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}

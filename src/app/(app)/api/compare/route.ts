import type { Product } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_COMPARE = 3

type CompareProduct = Partial<Product> & { id: Product['id'] }

const productSelect = {
  title: true,
  slug: true,
  gallery: true,
  priceInBDT: true,
  discountPercentage: true,
  enableVariants: true,
  inventory: true,
  productBadge: true,
} as const

const parseProductID = (value: unknown): Product['id'] | undefined => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) {
    const numericID = Number(value)
    return Number.isFinite(numericID) ? numericID : undefined
  }
}

const getProductID = (product: unknown): Product['id'] | undefined => {
  if (!product) return undefined
  if (typeof product === 'string' || typeof product === 'number') return parseProductID(product)
  if (typeof product === 'object' && 'id' in product) {
    return parseProductID(product.id)
  }
}

const getProductIDs = (products: unknown): Product['id'][] => {
  if (!Array.isArray(products)) return []

  return products.map(getProductID).filter((id): id is Product['id'] => typeof id === 'number')
}

const getPopulatedProducts = (products: unknown): CompareProduct[] => {
  if (!Array.isArray(products)) return []

  return products.filter(
    (product): product is CompareProduct =>
      Boolean(product) && typeof product === 'object' && 'id' in product,
  )
}

const jsonError = (message: string, status: number) => {
  return NextResponse.json({ error: message }, { status })
}

const getAuthenticatedUser = async (request: Request) => {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  return { payload, user }
}

const findCompareList = async ({
  payload,
  user,
}: {
  payload: Awaited<ReturnType<typeof getPayload>>
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>['user']>
}) => {
  const result = await payload.find({
    collection: 'compare-lists',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: {
      customer: true,
      products: true,
    },
    user,
    where: {
      customer: {
        equals: user.id,
      },
    },
  })

  return result.docs[0] ?? null
}

const findOrCreateCompareList = async ({
  payload,
  user,
}: {
  payload: Awaited<ReturnType<typeof getPayload>>
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>['user']>
}) => {
  const existing = await findCompareList({ payload, user })

  if (existing) return existing

  return payload.create({
    collection: 'compare-lists',
    data: {
      customer: user.id,
      products: [],
    },
    depth: 2,
    overrideAccess: false,
    user,
  })
}

const getPublishedProduct = async ({
  payload,
  productID,
  user,
}: {
  payload: Awaited<ReturnType<typeof getPayload>>
  productID: Product['id']
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>['user']>
}) => {
  const result = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: productSelect,
    user,
    where: {
      and: [
        { id: { equals: productID } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  return result.docs[0] ?? null
}

export async function GET(request: Request) {
  const { payload, user } = await getAuthenticatedUser(request)

  if (!user) return jsonError('Authentication is required.', 401)

  const compareList = await findCompareList({ payload, user })
  const products = getPopulatedProducts(compareList?.products)

  return NextResponse.json({
    productIds: getProductIDs(compareList?.products).map(String),
    products,
  })
}

export async function POST(request: Request) {
  const { payload, user } = await getAuthenticatedUser(request)

  if (!user) return jsonError('Authentication is required.', 401)

  const body = (await request.json().catch(() => null)) as { productId?: string | number } | null
  const productID = parseProductID(body?.productId)

  if (!productID) return jsonError('A productId is required.', 400)

  const product = await getPublishedProduct({ payload, productID, user })

  if (!product) return jsonError('Product not found.', 404)

  const compareList = await findOrCreateCompareList({ payload, user })
  const existingIDs = getProductIDs(compareList.products)

  if (existingIDs.map(String).includes(String(product.id))) {
    return NextResponse.json({
      productIds: existingIDs.map(String),
      products: getPopulatedProducts(compareList.products),
    })
  }

  if (existingIDs.length >= MAX_COMPARE) {
    return jsonError(`You can compare up to ${MAX_COMPARE} products.`, 400)
  }

  const updated = await payload.update({
    collection: 'compare-lists',
    data: {
      products: [...existingIDs, product.id],
    },
    depth: 2,
    id: compareList.id,
    overrideAccess: false,
    user,
  })

  return NextResponse.json({
    productIds: getProductIDs(updated.products).map(String),
    products: getPopulatedProducts(updated.products),
  })
}

export async function DELETE(request: Request) {
  const { payload, user } = await getAuthenticatedUser(request)

  if (!user) return jsonError('Authentication is required.', 401)

  const url = new URL(request.url)
  const productID = parseProductID(url.searchParams.get('productId'))
  const compareList = await findCompareList({ payload, user })

  if (!compareList) {
    return NextResponse.json({
      productIds: [],
      products: [],
    })
  }

  const existingIDs = getProductIDs(compareList.products)
  const products = productID ? existingIDs.filter((existingID) => existingID !== productID) : []

  const updated = await payload.update({
    collection: 'compare-lists',
    data: {
      products,
    },
    depth: 2,
    id: compareList.id,
    overrideAccess: false,
    user,
  })

  return NextResponse.json({
    productIds: getProductIDs(updated.products).map(String),
    products: getPopulatedProducts(updated.products),
  })
}

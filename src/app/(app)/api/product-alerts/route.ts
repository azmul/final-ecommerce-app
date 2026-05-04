import configPromise from '@payload-config'
import type { Product, Variant } from '@/payload-types'
import { getPayload, type Where } from 'payload'
import { NextResponse } from 'next/server'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('Authentication is required.', 401)
  }

  const url = new URL(request.url)
  const productId = url.searchParams.get('productId')

  const where: Where =
    productId && Number.isFinite(Number(productId))
      ? {
          active: { equals: true },
          product: { equals: Number(productId) },
        }
      : { active: { equals: true } }

  const result = await payload.find({
    collection: 'product-alerts',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: '-createdAt',
    user,
    where,
  })

  return NextResponse.json({ docs: result.docs })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('Authentication is required.', 401)
  }

  const body = (await request.json().catch(() => null)) as {
    alertType?: 'price_drop' | 'restock'
    productId?: number
    targetPrice?: number | null
    variantId?: number | null
  } | null

  if (!body?.productId || !body.alertType) {
    return jsonError('productId and alertType are required.', 400)
  }

  const productDoc = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      id: { equals: body.productId },
      _status: { equals: 'published' },
    },
  })

  const product = productDoc.docs[0] as Product | undefined
  if (!product) {
    return jsonError('Product not found.', 404)
  }

  let variantId: number | undefined
  if (body.variantId != null) {
    const v = await payload.findByID({
      id: body.variantId,
      collection: 'variants',
      depth: 0,
      overrideAccess: true,
    })

    const variant = v as Variant | undefined
    if (!variant) {
      return jsonError('Variant not found.', 404)
    }

    const vProduct =
      typeof variant.product === 'object' && variant.product && 'id' in variant.product
        ? variant.product.id
        : variant.product

    if (Number(vProduct) !== Number(product.id)) {
      return jsonError('Variant does not belong to this product.', 400)
    }

    variantId = typeof variant.id === 'number' ? variant.id : Number(variant.id)
  }

  try {
    const created = await payload.create({
      collection: 'product-alerts',
      data: {
        user: user.id,
        active: true,
        alertType: body.alertType,
        product: product.id,
        ...(body.alertType === 'price_drop' && typeof body.targetPrice === 'number'
          ? { targetPrice: body.targetPrice }
          : {}),
        ...(variantId !== undefined ? { variant: variantId } : {}),
      },
      overrideAccess: false,
      user,
    })

    return NextResponse.json({ doc: created })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not create alert.'
    return jsonError(message, 400)
  }
}

export async function DELETE(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('Authentication is required.', 401)
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id || !Number.isFinite(Number(id))) {
    return jsonError('id query parameter is required.', 400)
  }

  await payload.delete({
    collection: 'product-alerts',
    id: Number(id),
    overrideAccess: false,
    user,
  })

  return NextResponse.json({ ok: true })
}

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Body = {
  companyName?: unknown
  contactName?: unknown
  email?: unknown
  message?: unknown
  phone?: unknown
  productId?: unknown
  quantity?: unknown
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const productId = Number(body.productId)
  const quantity = Number(body.quantity)
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
  const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!Number.isFinite(productId) || !companyName || !contactName || !email) {
    return NextResponse.json({ error: 'Product, company, contact name, and email are required.' }, { status: 400 })
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ error: 'Quantity must be at least 1.' }, { status: 400 })
  }

  const product = await payload.findByID({
    id: productId,
    collection: 'products',
    depth: 0,
    overrideAccess: true,
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  }

  const quote = await payload.create({
    collection: 'quote-requests',
    data: {
      companyName,
      contactName,
      email,
      message,
      phone,
      product: productId,
      quantity,
      status: 'new',
      ...(auth.user ? { customer: auth.user.id } : {}),
    },
    overrideAccess: true,
  })

  return NextResponse.json({ id: quote.id, ok: true })
}

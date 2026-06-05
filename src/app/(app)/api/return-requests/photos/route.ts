import { verifyOrderAccess } from '@/lib/chat/orderAccess'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024
const MAX_PHOTOS = 3

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function pendingPhotoAlt(orderId: number): string {
  return `pending-return-order-${orderId}`
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError('Expected multipart form data.', 400)
  }

  const orderId = Number(formData.get('orderId'))
  const accessToken =
    typeof formData.get('accessToken') === 'string' ?
      String(formData.get('accessToken')).trim()
    : ''
  const file = formData.get('file')

  if (!Number.isFinite(orderId) || !(file instanceof File)) {
    return jsonError('orderId and file are required.', 400)
  }

  if (!file.type.startsWith('image/')) {
    return jsonError('Only image uploads are allowed.', 400)
  }

  if (file.size > MAX_BYTES) {
    return jsonError('Image must be 5 MB or smaller.', 400)
  }

  const order = await verifyOrderAccess({
    accessToken,
    orderId,
    payload,
    user: auth.user,
  })

  if (!order) {
    return jsonError('Order not found.', 404)
  }

  const alt = pendingPhotoAlt(order.id)

  const existingPhotos = await payload.find({
    collection: 'media',
    depth: 0,
    limit: MAX_PHOTOS + 1,
    overrideAccess: true,
    where: {
      alt: {
        equals: alt,
      },
    },
  })

  if (existingPhotos.totalDocs >= MAX_PHOTOS) {
    return jsonError(`You can upload up to ${MAX_PHOTOS} photos per order.`, 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const media = await payload.create({
    collection: 'media',
    data: {
      alt,
    },
    file: {
      data: buffer,
      mimetype: file.type,
      name: file.name,
      size: file.size,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ mediaId: media.id, ok: true })
}

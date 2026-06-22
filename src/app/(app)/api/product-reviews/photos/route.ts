import { isSameOrigin } from '@/lib/http/assertSameOrigin'
import { validateImageUpload } from '@/lib/upload/validateImageUpload'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024
const MAX_PHOTOS = 3

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError('Invalid request origin.', 403)
  }

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) return jsonError('Authentication required.', 401)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError('Expected multipart form data.', 400)
  }

  const reviewId = Number(formData.get('reviewId'))
  const file = formData.get('file')

  if (!Number.isFinite(reviewId) || !(file instanceof File)) {
    return jsonError('reviewId and file are required.', 400)
  }

  // Validate by content (magic bytes), not the spoofable declared type.
  const validation = await validateImageUpload(file, { maxBytes: MAX_BYTES })
  if (!validation.ok) {
    return jsonError(validation.error, 400)
  }

  const review = await payload.findByID({
    id: reviewId,
    collection: 'product-reviews',
    depth: 0,
    overrideAccess: true,
  })

  const authorId =
    typeof review.author === 'object' && review.author ? review.author.id : review.author

  if (authorId !== user.id) {
    return jsonError('Not found.', 404)
  }

  const existingPhotoIds = (Array.isArray(review.photos) ? review.photos : [])
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const photo = 'photo' in row ? row.photo : null
      if (typeof photo === 'number') return photo
      if (photo && typeof photo === 'object' && 'id' in photo) return photo.id as number
      return null
    })
    .filter((id): id is number => typeof id === 'number')

  if (existingPhotoIds.length >= MAX_PHOTOS) {
    return jsonError(`You can upload up to ${MAX_PHOTOS} photos per review.`, 400)
  }

  const buffer = validation.buffer!

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: `Review photo for product review ${reviewId}`,
    },
    file: {
      data: buffer,
      mimetype: validation.mime,
      name: file.name,
      size: buffer.length,
    },
    overrideAccess: true,
    user,
  })

  await payload.update({
    id: reviewId,
    collection: 'product-reviews',
    data: {
      photos: [...existingPhotoIds, media.id].map((photo) => ({ photo })),
    },
    overrideAccess: true,
    user,
  })

  return NextResponse.json({ mediaId: media.id, ok: true })
}

import { visualSearchProducts } from '@/lib/ai/visualSearch'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 4 * 1024 * 1024

export async function POST(request: Request) {
  const form = await request.formData()
  const file = form.get('image')
  const textHint = typeof form.get('description') === 'string' ? form.get('description') : undefined

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Image file is required.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 4MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'image/jpeg'
  const payload = await getPayload({ config: configPromise })

  const result = await visualSearchProducts({
    imageBase64: buffer.toString('base64'),
    limit: 12,
    mimeType,
    payload,
    textHint: typeof textHint === 'string' ? textHint : undefined,
  })

  return NextResponse.json(result)
}

import type { Media, TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { TestimonialsClient, type TestimonialEntry } from './Component.client'

async function resolveMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  value: number | Media | null | undefined,
): Promise<Media | null> {
  if (value == null) return null
  if (typeof value === 'object') return value

  try {
    const doc = await payload.findByID({
      collection: 'media',
      depth: 0,
      id: value,
    })
    return doc as Media
  } catch {
    return null
  }
}

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = async (props) => {
  const rawItems = props.items
  if (!rawItems?.length) return null

  const payload = await getPayload({ config: configPromise })

  const resolved = (
    await Promise.all(
      rawItems.map(async (row) => {
        if (!row?.quote?.trim() || !row?.name?.trim()) return null
        const photo = await resolveMedia(payload, row.photo)
        if (!photo) return null
        const entry: TestimonialEntry = {
          id: row.id ?? null,
          name: row.name.trim(),
          photo,
          quote: row.quote.trim(),
          role: typeof row.role === 'string' ? row.role : null,
        }
        return entry
      }),
    )
  ).filter((item): item is TestimonialEntry => item !== null)

  if (!resolved.length) return null

  return <TestimonialsClient items={resolved} />
}

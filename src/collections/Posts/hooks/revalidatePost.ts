import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import { revalidateSitemapAndLlms } from '@/lib/seo/revalidateSitemap'

import type { Post } from '@/payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      payload.logger.info(`Revalidating paths for post: ${doc.slug}`)

      revalidatePath('/blog')
      revalidatePath(`/blog/${doc.slug}`)
      revalidateSitemapAndLlms()
    }

    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      revalidatePath('/blog')
      revalidatePath(`/blog/${previousDoc.slug}`)
    }

    if (
      doc._status === 'published' &&
      previousDoc?._status === 'published' &&
      previousDoc.slug !== doc.slug
    ) {
      revalidatePath(`/blog/${previousDoc.slug}`)
    }
  }

  return doc
}

export const revalidateDeletePost: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate && doc?._status === 'published') {
    revalidatePath('/blog')

    if (doc.slug) {
      revalidatePath(`/blog/${doc.slug}`)
    }

    revalidateSitemapAndLlms()
  }

  return doc
}

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import { revalidateSitemapAndLlms, notifySearchEnginesOfUrls } from '@/lib/seo/revalidateSitemap'
import type { Product } from '@/payload-types'

const refreshProductPaths = (doc: Pick<Product, 'slug' | '_status'>) => {
  if (doc._status !== 'published' || typeof doc.slug !== 'string' || !doc.slug) {
    return
  }

  revalidatePath(`/products/${doc.slug}`)
  revalidatePath('/shop')
  revalidatePath('/')
  revalidateSitemapAndLlms()
  notifySearchEnginesOfUrls([`/products/${doc.slug}`])
}

export const revalidateProductPaths: CollectionAfterChangeHook<Product> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (context.disableRevalidate || context.skipProductNotificationTriggers) {
    return doc
  }

  if (doc._status === 'published') {
    refreshProductPaths(doc)
    payload.logger.info(`Revalidated product paths for slug: ${doc.slug}`)
  }

  if (previousDoc?._status === 'published' && doc._status !== 'published' && previousDoc.slug) {
    revalidatePath(`/products/${previousDoc.slug}`)
    revalidatePath('/shop')
    revalidatePath('/')
  }

  return doc
}

export const revalidateProductPathsDelete: CollectionAfterDeleteHook<Product> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate && doc?.slug) {
    revalidatePath(`/products/${doc.slug}`)
    revalidatePath('/shop')
    revalidatePath('/')
  }

  return doc
}

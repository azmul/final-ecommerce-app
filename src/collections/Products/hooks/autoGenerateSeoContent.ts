import type { CollectionAfterChangeHook } from 'payload'

import { maybeAutoGenerateProductSeoContent } from '@/lib/ai/generateSeoContent'
import type { Product } from '@/payload-types'

export const autoGenerateSeoContent: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!req?.payload || doc._status !== 'published') return doc
  if (req.context?.skipSeoAutoGenerate || req.context?.disableRevalidate) return doc

  const product = doc as Product
  await maybeAutoGenerateProductSeoContent({ payload: req.payload, product })

  return doc
}

import type { CollectionAfterChangeHook } from 'payload'

import { maybeAutoGenerateProductSeoContent } from '@/lib/ai/generateSeoContent'
import { deferTask } from '@/lib/payload/deferTask'
import type { Product } from '@/payload-types'

export const autoGenerateSeoContent: CollectionAfterChangeHook = ({ doc, req }) => {
  if (!req?.payload || doc._status !== 'published') return doc
  if (req.context?.skipSeoAutoGenerate || req.context?.disableRevalidate) return doc

  const payload = req.payload
  const product = doc as Product

  deferTask(payload, 'autoGenerateSeoContent', async () => {
    await maybeAutoGenerateProductSeoContent({ payload, product })
  })

  return doc
}

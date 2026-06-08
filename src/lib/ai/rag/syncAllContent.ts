import type { Payload, Where } from 'payload'

import {
  RAG_SYNC_COLLECTIONS,
  RAG_SYNC_GLOBALS,
  syncRagDocument,
  syncRagGlobal,
} from '@/lib/ai/rag/syncContentDocument'

const PAGE_SIZE = 50

async function syncCollection(args: {
  collection: string
  page: number
  payload: Payload
  where?: Where
}): Promise<{ hasNextPage: boolean; synced: number }> {
  const result = await args.payload.find({
    collection: args.collection as 'pages',
    depth: 1,
    limit: PAGE_SIZE,
    overrideAccess: true,
    page: args.page,
    where: args.where,
  })

  let synced = 0

  for (const doc of result.docs) {
    const outcome = await syncRagDocument({
      collection: args.collection,
      doc: doc as unknown as Record<string, unknown>,
      payload: args.payload,
    })
    if (outcome.synced) synced += 1
  }

  return { hasNextPage: result.hasNextPage, synced }
}

export async function syncAllSiteContent(payload: Payload): Promise<{ synced: number }> {
  let synced = 0

  for (const collection of RAG_SYNC_COLLECTIONS) {
    const where: Where | undefined =
      collection === 'pages' || collection === 'posts' || collection === 'products'
        ? { _status: { equals: 'published' } }
        : undefined

    let page = 1
    while (true) {
      const result = await syncCollection({
        collection,
        page,
        payload,
        where,
      })
      synced += result.synced
      if (!result.hasNextPage) break
      page += 1
    }
  }

  for (const globalSlug of RAG_SYNC_GLOBALS) {
    const globalDoc = await payload.findGlobal({
      slug: globalSlug,
      overrideAccess: true,
    })

    const outcome = await syncRagGlobal({
      data: globalDoc as unknown as Record<string, unknown>,
      globalSlug,
      payload,
    })

    if (outcome.synced) synced += 1
  }

  return { synced }
}

/** @deprecated Use syncAllSiteContent() */
export async function syncKnowledgeBaseFromPages(payload: Payload): Promise<{ synced: number }> {
  return syncAllSiteContent(payload)
}

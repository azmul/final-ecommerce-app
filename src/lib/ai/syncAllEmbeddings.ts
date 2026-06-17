import { syncAllSiteContent } from '@/lib/ai/rag/syncAllContent'
import { syncAllProductEmbeddings } from '@/lib/ai/syncAllProductEmbeddings'
import type { Payload } from 'payload'

export type SyncAllEmbeddingsResult = {
  contentSynced: number
  productEmbeddingsSkipped: number
  productEmbeddingsSynced: number
  /** @deprecated Use contentSynced */
  synced: number
}

export async function syncAllEmbeddings(payload: Payload): Promise<SyncAllEmbeddingsResult> {
  const content = await syncAllSiteContent(payload)
  const products = await syncAllProductEmbeddings(payload)

  return {
    contentSynced: content.synced,
    productEmbeddingsSkipped: products.skipped,
    productEmbeddingsSynced: products.synced,
    synced: content.synced,
  }
}

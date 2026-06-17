import { getEmbeddingConfig } from '@/lib/ai/config'
import { syncAllEmbeddings } from '@/lib/ai/syncAllEmbeddings'
import type { Payload } from 'payload'

let startupSyncPromise: Promise<void> | null = null

export function scheduleRagStartupSync(payload: Payload): void {
  if (process.env.RAG_SYNC_ON_STARTUP !== 'true') return
  if (!getEmbeddingConfig().enabled) return
  if (startupSyncPromise) return

  startupSyncPromise = (async () => {
    try {
      payload.logger.info({ msg: 'rag-startup-sync-begin' })
      const result = await syncAllEmbeddings(payload)
      payload.logger.info({ msg: 'rag-startup-sync-complete', ...result })
    } catch (error) {
      payload.logger.error({ err: error, msg: 'rag-startup-sync-failed' })
    }
  })()
}

import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { deferTask } from '@/lib/payload/deferTask'
import {
  deleteRagDocument,
  syncRagDocument,
  syncRagGlobal,
  type RagSyncGlobal,
} from '@/lib/ai/rag/syncContentDocument'

const SKIP_CONTEXT_KEY = 'skipRagSync'

export function createRagAfterChangeHook(collection: string): CollectionAfterChangeHook {
  return ({ doc, req }) => {
    if (!req?.payload || req.context?.[SKIP_CONTEXT_KEY]) return

    const record = doc as Record<string, unknown>
    deferTask(req.payload, `rag-sync:${collection}:${String(record.id)}`, async () => {
      await syncRagDocument({
        collection,
        doc: record,
        payload: req.payload,
      })
    })
  }
}

export function createRagAfterDeleteHook(collection: string): CollectionAfterDeleteHook {
  return ({ doc, req }) => {
    if (!req?.payload || req.context?.[SKIP_CONTEXT_KEY]) return

    const id = Number((doc as { id?: unknown }).id)
    if (!Number.isFinite(id)) return

    deferTask(req.payload, `rag-delete:${collection}:${id}`, async () => {
      await deleteRagDocument({
        collection,
        docId: id,
        payload: req.payload,
      })
    })
  }
}

export function createGlobalRagAfterChangeHook(globalSlug: RagSyncGlobal): GlobalAfterChangeHook {
  return ({ doc, req }) => {
    if (!req?.payload || req.context?.[SKIP_CONTEXT_KEY]) return

    deferTask(req.payload, `rag-sync:global:${globalSlug}`, async () => {
      await syncRagGlobal({
        data: doc as Record<string, unknown>,
        globalSlug,
        payload: req.payload,
      })
    })
  }
}

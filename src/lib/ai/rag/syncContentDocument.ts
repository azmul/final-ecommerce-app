import { getEmbeddingConfig } from '@/lib/ai/config'
import {
  deleteContentEmbeddings,
  replaceContentEmbeddings,
} from '@/lib/ai/rag/contentEmbeddings'
import {
  extractDocumentChunks,
  isPublishedForRag,
} from '@/lib/ai/rag/extractDocument'
import type { Payload } from 'payload'

export const RAG_SYNC_COLLECTIONS = [
  'pages',
  'posts',
  'products',
  'categories',
  'subcategories',
  'brands',
] as const

export const RAG_SYNC_GLOBALS = ['header', 'footer'] as const

export type RagSyncCollection = (typeof RAG_SYNC_COLLECTIONS)[number]
export type RagSyncGlobal = (typeof RAG_SYNC_GLOBALS)[number]

export function isRagSyncEnabled(): boolean {
  return getEmbeddingConfig().enabled
}

export async function syncRagDocument(args: {
  collection: string
  doc: Record<string, unknown>
  payload: Payload
}): Promise<{ synced: boolean; chunkCount: number }> {
  const sourceId = Number(args.doc.id)
  if (!Number.isFinite(sourceId)) return { chunkCount: 0, synced: false }

  if (!isPublishedForRag(args.collection, args.doc)) {
    await deleteContentEmbeddings({
      payload: args.payload,
      sourceId,
      sourceType: args.collection,
    })
    return { chunkCount: 0, synced: false }
  }

  const chunks = extractDocumentChunks({
    collection: args.collection,
    doc: args.doc,
  })

  if (!chunks.length) {
    await deleteContentEmbeddings({
      payload: args.payload,
      sourceId,
      sourceType: args.collection,
    })
    return { chunkCount: 0, synced: false }
  }

  if (!isRagSyncEnabled()) {
    return { chunkCount: chunks.length, synced: false }
  }

  await replaceContentEmbeddings({
    chunks,
    payload: args.payload,
    sourceId,
    sourceType: args.collection,
  })

  return { chunkCount: chunks.length, synced: true }
}

export async function syncRagGlobal(args: {
  globalSlug: RagSyncGlobal
  data: Record<string, unknown>
  payload: Payload
}): Promise<{ synced: boolean; chunkCount: number }> {
  const sourceType = `global:${args.globalSlug}`
  const sourceId = 1

  const chunks = extractDocumentChunks({
    collection: args.globalSlug,
    doc: { ...args.data, id: sourceId },
  })

  if (!chunks.length) {
    await deleteContentEmbeddings({
      payload: args.payload,
      sourceId,
      sourceType,
    })
    return { chunkCount: 0, synced: false }
  }

  if (!isRagSyncEnabled()) {
    return { chunkCount: chunks.length, synced: false }
  }

  await replaceContentEmbeddings({
    chunks,
    payload: args.payload,
    sourceId,
    sourceType,
  })

  return { chunkCount: chunks.length, synced: true }
}

export async function deleteRagDocument(args: {
  collection: string
  docId: number
  payload: Payload
}): Promise<void> {
  await deleteContentEmbeddings({
    payload: args.payload,
    sourceId: args.docId,
    sourceType: args.collection,
  })
}

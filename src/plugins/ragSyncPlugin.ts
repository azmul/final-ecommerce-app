import type { Config, Plugin } from 'payload'

import {
  createGlobalRagAfterChangeHook,
  createRagAfterChangeHook,
  createRagAfterDeleteHook,
} from '@/lib/ai/rag/hooks'
import {
  RAG_SYNC_COLLECTIONS,
  RAG_SYNC_GLOBALS,
} from '@/lib/ai/rag/syncContentDocument'

function getCollectionSlug(candidate: unknown): string | undefined {
  if (
    candidate &&
    typeof candidate === 'object' &&
    'slug' in candidate &&
    typeof (candidate as { slug: unknown }).slug === 'string'
  ) {
    return (candidate as { slug: string }).slug
  }

  return undefined
}

function getGlobalSlug(candidate: unknown): string | undefined {
  if (
    candidate &&
    typeof candidate === 'object' &&
    'slug' in candidate &&
    typeof (candidate as { slug: unknown }).slug === 'string'
  ) {
    return (candidate as { slug: string }).slug
  }

  return undefined
}

/**
 * Payload-style RAG sync: chunk on save, embed, store vectors in Postgres, keep in sync on change/delete.
 * Mirrors the AI auto-embedding flow described at https://payloadcms.com/enterprise/ai-framework
 */
export function ragSyncPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const ragCollections = new Set<string>(RAG_SYNC_COLLECTIONS)
    const ragGlobals = new Set<string>(RAG_SYNC_GLOBALS)

    const collections = (incomingConfig.collections ?? []).map((collection) => {
      const slug = getCollectionSlug(collection)
      if (!slug || !ragCollections.has(slug)) return collection

      return {
        ...collection,
        hooks: {
          ...collection.hooks,
          afterChange: [
            ...(collection.hooks?.afterChange ?? []),
            createRagAfterChangeHook(slug),
          ],
          afterDelete: [
            ...(collection.hooks?.afterDelete ?? []),
            createRagAfterDeleteHook(slug),
          ],
        },
      }
    })

    const globals = (incomingConfig.globals ?? []).map((global) => {
      const slug = getGlobalSlug(global)
      if (!slug || !ragGlobals.has(slug)) return global

      return {
        ...global,
        hooks: {
          ...global.hooks,
          afterChange: [
            ...(global.hooks?.afterChange ?? []),
            createGlobalRagAfterChangeHook(slug as (typeof RAG_SYNC_GLOBALS)[number]),
          ],
        },
      }
    })

    return {
      ...incomingConfig,
      collections,
      globals,
    }
  }
}

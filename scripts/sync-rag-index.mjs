#!/usr/bin/env node
/**
 * Re-index all RAG content chunks and product embeddings into pgvector.
 *
 *   pnpm sync:rag
 *   pnpm sync:rag -- --products-only
 *   pnpm sync:rag -- --content-only
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import { syncAllEmbeddings } from '../src/lib/ai/syncAllEmbeddings.ts'
import { syncAllProductEmbeddings } from '../src/lib/ai/syncAllProductEmbeddings.ts'
import { syncAllSiteContent } from '../src/lib/ai/rag/syncAllContent.ts'
import config from '../src/payload.config.ts'

const args = process.argv.slice(2)
const productsOnly = args.includes('--products-only')
const contentOnly = args.includes('--content-only')

const payload = await getPayload({ config })

console.log('Syncing AI search indexes...')

let result
if (productsOnly) {
  result = { products: await syncAllProductEmbeddings(payload) }
} else if (contentOnly) {
  result = { content: await syncAllSiteContent(payload) }
} else {
  result = await syncAllEmbeddings(payload)
}

console.log(JSON.stringify(result, null, 2))
console.log('Done.')
process.exit(0)

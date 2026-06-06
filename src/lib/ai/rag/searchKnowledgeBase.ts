import { createEmbedding } from '@/lib/ai/embeddings'
import { searchContentEmbeddings, syncPageContentEmbedding } from '@/lib/ai/rag/contentEmbeddings'
import { extractLexicalPlainText } from '@/utilities/extractLexicalPlainText'
import type { Payload } from 'payload'

export async function searchKnowledgeBaseForAi(
  payload: Payload,
  args: { limit?: number; query: string },
): Promise<{ chunks: { score: number; sourceId: number; sourceType: string; text: string }[] }> {
  const query = args.query.trim()
  if (!query) return { chunks: [] }

  const embedding = await createEmbedding(query)
  if (!embedding) return { chunks: [] }

  const limit = Math.min(Math.max(args.limit ?? 5, 1), 10)
  const matches = await searchContentEmbeddings({
    limit,
    payload,
    queryEmbedding: embedding,
  })

  return {
    chunks: matches.map((match) => ({
      score: match.score,
      sourceId: match.sourceId,
      sourceType: match.sourceType,
      text: match.chunkText,
    })),
  }
}

export async function syncKnowledgeBaseFromPages(payload: Payload): Promise<{ synced: number }> {
  const slugs = ['faq', 'contact', 'about', 'shipping', 'returns']
  let synced = 0

  for (const slug of slugs) {
    const pages = await payload.find({
      collection: 'pages',
      depth: 1,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: slug } },
    })

    const page = pages.docs[0]
    if (!page) continue

    const parts: string[] = [page.title ?? slug]

    if (page.layout && Array.isArray(page.layout)) {
      for (const block of page.layout) {
        if (!block || typeof block !== 'object') continue
        const row = block as unknown as Record<string, unknown>
        if (row.blockType === 'faq' && Array.isArray(row.faqs)) {
          for (const faq of row.faqs) {
            if (faq && typeof faq === 'object') {
              const entry = faq as { answer?: string; question?: string }
              parts.push(`${entry.question ?? ''}\n${entry.answer ?? ''}`)
            }
          }
        }
        if (row.blockType === 'content' && row.content) {
          parts.push(extractLexicalPlainText(row.content as never, 2000) ?? '')
        }
      }
    }

    const text = parts.filter(Boolean).join('\n\n').trim()
    if (!text) continue

    await syncPageContentEmbedding({
      pageId: page.id,
      payload,
      sourceType: 'policy',
      text,
    })
    synced += 1
  }

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: { _status: { equals: 'published' } },
  })

  for (const product of products.docs) {
    const seo = (product as { seoContent?: { faqs?: { answer?: string; question?: string }[] } })
      .seoContent
    const faqs = seo?.faqs ?? []
    if (!faqs.length) continue

    const text = faqs
      .map((faq) => `${faq.question ?? ''}\n${faq.answer ?? ''}`)
      .join('\n\n')
      .trim()

    if (!text) continue

    await syncPageContentEmbedding({
      pageId: product.id,
      payload,
      sourceType: 'product_faq',
      text: `${product.title}\n${text}`,
    })
    synced += 1
  }

  return { synced }
}

import { getRagConfig } from '@/lib/ai/config'
import { buildFaqChunk, chunkPlainText } from '@/lib/ai/rag/chunkText'
import { extractLexicalPlainTextFull } from '@/lib/ai/rag/extractLexical'
import type { KnowledgeChunkInput } from '@/lib/ai/rag/types'
import { resolveSourceUrl } from '@/lib/ai/rag/resolveSourceUrl'

type SeoContent = {
  aiSummary?: string | null
  answer?: string | null
  buyingGuide?: string | null
  faqs?: { answer?: string | null; question?: string | null }[] | null
  keyTakeaways?: { point?: string | null }[] | null
  overview?: string | null
  question?: string | null
  usageInfo?: string | null
  whyChooseThis?: string | null
}

function appendSeoContentParts(parts: string[], seo: SeoContent | null | undefined): void {
  if (!seo) return
  if (seo.aiSummary?.trim()) parts.push(seo.aiSummary.trim())
  if (seo.overview?.trim()) parts.push(seo.overview.trim())
  if (seo.buyingGuide?.trim()) parts.push(seo.buyingGuide.trim())
  if (seo.whyChooseThis?.trim()) parts.push(seo.whyChooseThis.trim())
  if (seo.usageInfo?.trim()) parts.push(seo.usageInfo.trim())

  for (const takeaway of seo.keyTakeaways ?? []) {
    if (takeaway.point?.trim()) parts.push(takeaway.point.trim())
  }
}

function appendFaqChunks(args: {
  chunkIndex: number
  chunks: KnowledgeChunkInput[]
  faqs: SeoContent['faqs']
  prefix?: string
  ragConfig: ReturnType<typeof getRagConfig>
  sourceCollection: string
  sourceId: number
  sourceSlug?: string
  sourceUrl?: string
  title: string
}): number {
  let chunkIndex = args.chunkIndex

  for (const faq of args.faqs ?? []) {
    if (!faq?.question?.trim() && !faq?.answer?.trim()) continue

    const chunk = buildFaqChunk({
      answer: faq.answer ?? '',
      chunkIndex: chunkIndex++,
      prefix: args.prefix,
      question: faq.question ?? '',
      sourceSlug: args.sourceSlug,
      title: args.title,
    })

    args.chunks.push({
      ...chunk,
      sourceCollection: args.sourceCollection,
      sourceUrl: args.sourceUrl,
    })
  }

  return chunkIndex
}

function appendPlainTextChunks(args: {
  chunkIndex: number
  chunks: KnowledgeChunkInput[]
  ragConfig: ReturnType<typeof getRagConfig>
  sourceCollection: string
  sourceSlug?: string
  sourceUrl?: string
  text: string
  title: string
}): number {
  const contentChunks = chunkPlainText({
    maxChars: args.ragConfig.chunkMaxChars,
    overlap: args.ragConfig.chunkOverlap,
    sourceSlug: args.sourceSlug,
    startIndex: args.chunkIndex,
    text: args.text,
    title: args.title,
  })

  for (const chunk of contentChunks) {
    args.chunks.push({
      ...chunk,
      sourceCollection: args.sourceCollection,
      sourceUrl: args.sourceUrl,
    })
  }

  return args.chunkIndex + contentChunks.length
}

function extractTextFromBlock(row: Record<string, unknown>): string[] {
  const parts: string[] = []

  for (const [key, value] of Object.entries(row)) {
    if (key === 'blockType' || key === 'id' || key === 'blockName') continue

    if (typeof value === 'string' && value.trim()) {
      parts.push(value.trim())
      continue
    }

    if (key === 'content' || key === 'richText' || key === 'introContent') {
      const plain = extractLexicalPlainTextFull(value)
      if (plain) parts.push(plain)
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          if ('question' in item || 'answer' in item) {
            const faq = item as { answer?: string; question?: string }
            parts.push(`${faq.question ?? ''}\n${faq.answer ?? ''}`.trim())
          } else {
            parts.push(...extractTextFromBlock(item as Record<string, unknown>))
          }
        } else if (typeof item === 'string' && item.trim()) {
          parts.push(item.trim())
        }
      }
    }
  }

  return parts.filter(Boolean)
}

export function extractPageLayoutChunks(args: {
  layout: unknown
  ragConfig: ReturnType<typeof getRagConfig>
  sourceCollection: string
  sourceId: number
  sourceSlug?: string
  sourceUrl?: string
  startIndex?: number
  title: string
}): KnowledgeChunkInput[] {
  const chunks: KnowledgeChunkInput[] = []
  let chunkIndex = args.startIndex ?? 0

  if (!Array.isArray(args.layout)) return chunks

  for (const block of args.layout) {
    if (!block || typeof block !== 'object') continue
    const row = block as Record<string, unknown>

    if (row.blockType === 'faq' && Array.isArray(row.faqs)) {
      chunkIndex = appendFaqChunks({
        chunkIndex,
        chunks,
        faqs: row.faqs as SeoContent['faqs'],
        ragConfig: args.ragConfig,
        sourceCollection: args.sourceCollection,
        sourceId: args.sourceId,
        sourceSlug: args.sourceSlug,
        sourceUrl: args.sourceUrl,
        title: args.title,
      })
      continue
    }

    const blockParts = extractTextFromBlock(row)
    if (!blockParts.length) continue

    chunkIndex = appendPlainTextChunks({
      chunkIndex,
      chunks,
      ragConfig: args.ragConfig,
      sourceCollection: args.sourceCollection,
      sourceSlug: args.sourceSlug,
      sourceUrl: args.sourceUrl,
      text: blockParts.join('\n\n'),
      title: args.title,
    })
  }

  return chunks
}

function extractNavItems(items: unknown): string[] {
  if (!Array.isArray(items)) return []

  const parts: string[] = []

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const row = item as {
      link?: {
        label?: string
        type?: string
        url?: string
        reference?: { relationTo?: string; value?: { slug?: string; title?: string } | number }
      }
    }

    const label = row.link?.label?.trim()
    if (label) parts.push(label)

    const reference = row.link?.reference
    if (reference && typeof reference.value === 'object' && reference.value) {
      const refTitle = reference.value.title?.trim()
      const refSlug = reference.value.slug?.trim()
      if (refTitle) parts.push(refTitle)
      if (refSlug) parts.push(refSlug)
    }

    if (row.link?.url?.trim()) parts.push(row.link.url.trim())
  }

  return parts
}

export function extractDocumentChunks(args: {
  collection: string
  doc: Record<string, unknown>
  ragConfig?: ReturnType<typeof getRagConfig>
}): KnowledgeChunkInput[] {
  const ragConfig = args.ragConfig ?? getRagConfig()
  const doc = args.doc
  const sourceId = Number(doc.id)
  if (!Number.isFinite(sourceId)) return []

  const slug = typeof doc.slug === 'string' ? doc.slug : undefined
  const title =
    (typeof doc.title === 'string' && doc.title.trim()) ||
    slug ||
    args.collection

  const sourceUrl = resolveSourceUrl({ collection: args.collection, slug })
  const chunks: KnowledgeChunkInput[] = []
  let chunkIndex = 0

  const meta = doc.meta as { description?: string | null; title?: string | null } | undefined
  const seoContent = doc.seoContent as SeoContent | undefined

  if (args.collection === 'pages') {
    const introParts = [title]
    if (meta?.title?.trim()) introParts.push(meta.title.trim())
    if (meta?.description?.trim()) introParts.push(meta.description.trim())
    appendSeoContentParts(introParts, seoContent)

    chunkIndex = appendPlainTextChunks({
      chunkIndex,
      chunks,
      ragConfig,
      sourceCollection: args.collection,
      sourceSlug: slug,
      sourceUrl,
      text: introParts.join('\n\n'),
      title,
    })

    chunks.push(
      ...extractPageLayoutChunks({
        layout: doc.layout,
        ragConfig,
        sourceCollection: args.collection,
        sourceId,
        sourceSlug: slug,
        sourceUrl,
        startIndex: chunkIndex,
        title,
      }),
    )

    return chunks
  }

  if (args.collection === 'posts') {
    const parts = [title]
    if (typeof doc.excerpt === 'string' && doc.excerpt.trim()) parts.push(doc.excerpt.trim())
    if (meta?.description?.trim()) parts.push(meta.description.trim())
    appendSeoContentParts(parts, seoContent)

    const content = extractLexicalPlainTextFull(doc.content)
    if (content) parts.push(content)

    chunkIndex = appendPlainTextChunks({
      chunkIndex,
      chunks,
      ragConfig,
      sourceCollection: args.collection,
      sourceSlug: slug,
      sourceUrl,
      text: parts.join('\n\n'),
      title,
    })

    chunkIndex = appendFaqChunks({
      chunkIndex,
      chunks,
      faqs: seoContent?.faqs,
      ragConfig,
      sourceCollection: args.collection,
      sourceId,
      sourceSlug: slug,
      sourceUrl,
      title,
    })

    return chunks
  }

  if (args.collection === 'products') {
    const parts = [title]
    const description = extractLexicalPlainTextFull(doc.description)
    if (description) parts.push(description)
    appendSeoContentParts(parts, seoContent)

    for (const feature of (seoContent as { keyFeatures?: { feature?: string }[] })?.keyFeatures ??
      []) {
      if (feature.feature?.trim()) parts.push(feature.feature.trim())
    }

    for (const spec of (doc.technicalSpecs as { label?: string; value?: string }[] | undefined) ??
      []) {
      if (spec.label?.trim() || spec.value?.trim()) {
        parts.push(`${spec.label ?? ''} ${spec.value ?? ''}`.trim())
      }
    }

    if (meta?.description?.trim()) parts.push(meta.description.trim())

    chunkIndex = appendPlainTextChunks({
      chunkIndex,
      chunks,
      ragConfig,
      sourceCollection: args.collection,
      sourceSlug: slug,
      sourceUrl,
      text: parts.join('\n\n'),
      title,
    })

    chunkIndex = appendFaqChunks({
      chunkIndex,
      chunks,
      faqs: seoContent?.faqs,
      prefix: title,
      ragConfig,
      sourceCollection: args.collection,
      sourceId,
      sourceSlug: slug,
      sourceUrl,
      title: `${title} FAQ`,
    })

    return chunks
  }

  if (
    args.collection === 'categories' ||
    args.collection === 'subcategories' ||
    args.collection === 'brands'
  ) {
    const parts = [title]
    if (meta?.description?.trim()) parts.push(meta.description.trim())
    appendSeoContentParts(parts, seoContent)

    chunkIndex = appendPlainTextChunks({
      chunkIndex,
      chunks,
      ragConfig,
      sourceCollection: args.collection,
      sourceSlug: slug,
      sourceUrl,
      text: parts.join('\n\n'),
      title,
    })

    chunkIndex = appendFaqChunks({
      chunkIndex,
      chunks,
      faqs: seoContent?.faqs,
      ragConfig,
      sourceCollection: args.collection,
      sourceId,
      sourceSlug: slug,
      sourceUrl,
      title,
    })

    return chunks
  }

  if (args.collection === 'header' || args.collection === 'footer') {
    const navParts = extractNavItems(doc.navItems)
    const label = args.collection === 'header' ? 'Site header navigation' : 'Site footer navigation'

    return appendPlainTextChunks({
      chunkIndex: 0,
      chunks,
      ragConfig,
      sourceCollection: `global:${args.collection}`,
      sourceSlug: args.collection,
      sourceUrl: resolveSourceUrl({ collection: `global:${args.collection}` }),
      text: [label, ...navParts].join('\n'),
      title: label,
    })
  }

  return chunks
}

export function isPublishedForRag(collection: string, doc: Record<string, unknown>): boolean {
  if (collection === 'pages' || collection === 'posts' || collection === 'products') {
    return doc._status === 'published'
  }
  return true
}

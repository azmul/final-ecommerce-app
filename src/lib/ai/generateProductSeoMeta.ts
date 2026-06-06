import { extractLexicalPlainText } from '@/utilities/extractLexicalPlainText'
import type { Product } from '@/payload-types'

import { generateProductFieldContent } from '@/lib/ai/generateProductFieldContent'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'

const siteTitle = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'

function productContext(doc: Product) {
  const brandTitle =
    doc.brand && typeof doc.brand === 'object' ? (doc.brand.title ?? undefined) : undefined

  const categories =
    doc.categories
      ?.map((c) => (typeof c === 'object' && c?.title ? c.title : ''))
      .filter(Boolean) ?? []

  return {
    brand: brandTitle,
    categories,
    descriptionText: extractLexicalPlainText(doc.description, 1200) ?? undefined,
    priceInBDT: typeof doc.priceInBDT === 'number' ? doc.priceInBDT : null,
    technicalSpecs: doc.technicalSpecs?.map((row) => ({
      label: row.label,
      value: row.value,
    })),
    title: doc.title?.trim() ?? '',
  }
}

export async function generateProductMetaTitle(doc: Product): Promise<string> {
  const fallback = doc.title ? `${doc.title} | ${siteTitle}` : siteTitle
  if (!isAiShoppingAssistantEnabled() || !doc.title?.trim()) return fallback

  const generated = await generateProductFieldContent({
    context: productContext(doc),
    fieldKey: 'meta.title',
  })

  return typeof generated === 'string' && generated.trim() ? generated.trim() : fallback
}

export async function generateProductMetaDescription(doc: Product): Promise<string> {
  const seoSummary = (doc as Product & { seoContent?: { aiSummary?: string } }).seoContent
    ?.aiSummary
  const fallback =
    seoSummary?.trim() ||
    extractLexicalPlainText(doc.description, 155) ||
    `Shop ${doc.title} online in Bangladesh.`

  if (!isAiShoppingAssistantEnabled() || !doc.title?.trim()) return fallback

  const generated = await generateProductFieldContent({
    context: productContext(doc),
    fieldKey: 'meta.description',
  })

  return typeof generated === 'string' && generated.trim() ? generated.trim() : fallback
}

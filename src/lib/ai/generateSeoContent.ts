import { callDeepSeekChat } from '@/lib/ai/deepseek'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { extractLexicalPlainText } from '@/utilities/extractLexicalPlainText'
import type { Product, Variant } from '@/payload-types'
import type { Payload } from 'payload'

export type GeneratedSeoContent = {
  aiSummary: string
  faqs: { answer: string; question: string }[]
  keyFeatures: { feature: string }[]
  shippingReturnsNote: string
  usageInfo: string
  whyChooseThis: string
}

function parseSeoContentJson(raw: string): GeneratedSeoContent | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GeneratedSeoContent>
    if (typeof parsed.aiSummary !== 'string' || !parsed.aiSummary.trim()) return null

    return {
      aiSummary: parsed.aiSummary.trim(),
      faqs: Array.isArray(parsed.faqs)
        ? parsed.faqs
            .filter(
              (f): f is { answer: string; question: string } =>
                typeof f === 'object' &&
                f !== null &&
                typeof f.question === 'string' &&
                typeof f.answer === 'string',
            )
            .slice(0, 6)
        : [],
      keyFeatures: Array.isArray(parsed.keyFeatures)
        ? parsed.keyFeatures
            .filter(
              (f): f is { feature: string } =>
                typeof f === 'object' && f !== null && typeof f.feature === 'string',
            )
            .slice(0, 8)
        : [],
      shippingReturnsNote:
        typeof parsed.shippingReturnsNote === 'string' ? parsed.shippingReturnsNote.trim() : '',
      usageInfo: typeof parsed.usageInfo === 'string' ? parsed.usageInfo.trim() : '',
      whyChooseThis: typeof parsed.whyChooseThis === 'string' ? parsed.whyChooseThis.trim() : '',
    }
  } catch {
    return null
  }
}

export async function generateProductSeoContent(args: {
  payload: Payload
  product: Product
  variants: Variant[]
}): Promise<GeneratedSeoContent | null> {
  if (!isAiShoppingAssistantEnabled()) return null

  const brandTitle =
    args.product.brand && typeof args.product.brand === 'object' ?
      (args.product.brand.title ?? '')
    : ''

  const categoryTitles =
    args.product.categories
      ?.map((c) => (typeof c === 'object' && c?.title ? c.title : ''))
      .filter(Boolean)
      .join(', ') ?? ''

  const description = extractLexicalPlainText(args.product.description, 1200)
  const specs =
    args.product.technicalSpecs
      ?.map((s) => `${s.label}: ${s.value}`)
      .filter(Boolean)
      .join('; ') ?? ''

  const variantSummary = args.variants
    .slice(0, 12)
    .map((v) => {
      const opts =
        v.options
          ?.map((o) => (typeof o === 'object' && o?.label ? o.label : ''))
          .filter(Boolean)
          .join('/') ?? ''
      return `${opts || 'default'} — ${v.priceInBDT ?? args.product.priceInBDT} BDT`
    })
    .join('\n')

  const completion = await callDeepSeekChat({
    messages: [
      {
        role: 'system',
        content: `You generate SEO and AI-search (AISO) content for an ecommerce product page in Bangladesh (BDT currency). Respond with ONLY valid JSON:

{
  "aiSummary": "2-4 factual sentences for meta/AI citations",
  "keyFeatures": [{"feature": "string"}],
  "whyChooseThis": "short paragraph",
  "usageInfo": "usage and care notes",
  "shippingReturnsNote": "delivery and returns note for Bangladesh shoppers",
  "faqs": [{"question": "string", "answer": "string"}]
}

Use only provided product data. Do not invent specs or policies not implied by the data.`,
      },
      {
        role: 'user',
        content: [
          `Title: ${args.product.title}`,
          brandTitle ? `Brand: ${brandTitle}` : '',
          categoryTitles ? `Categories: ${categoryTitles}` : '',
          description ? `Description: ${description}` : '',
          specs ? `Specs: ${specs}` : '',
          variantSummary ? `Variants/prices:\n${variantSummary}` : '',
          typeof args.product.reviewAverageRating === 'number' ?
            `Rating: ${args.product.reviewAverageRating}/5 (${args.product.reviewCount ?? 0} reviews)`
          : '',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
    tools: false,
  })

  const raw = completion.choices?.[0]?.message?.content?.trim()
  if (!raw) return null

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  return parseSeoContentJson(jsonMatch?.[0] ?? raw)
}

export async function maybeAutoGenerateProductSeoContent(args: {
  payload: Payload
  product: Product
}): Promise<void> {
  const existing = (args.product as Product & { seoContent?: { aiSummary?: string } }).seoContent
  if (existing?.aiSummary?.trim()) return

  const variants = await args.payload.find({
    collection: 'variants',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    where: { product: { equals: args.product.id } },
  })

  const generated = await generateProductSeoContent({
    payload: args.payload,
    product: args.product,
    variants: variants.docs as Variant[],
  })

  if (!generated) return

  await args.payload.update({
    collection: 'products',
    context: { skipProductEmbedding: true, skipSeoAutoGenerate: true },
    data: {
      seoContent: generated,
      seoContentAutoGenerated: true,
    } as never,
    id: args.product.id,
    overrideAccess: true,
  })
}

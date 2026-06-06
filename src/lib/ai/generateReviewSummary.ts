import { callDeepSeekChat } from '@/lib/ai/deepseek'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import type { ProductReview } from '@/payload-types'
import type { Payload } from 'payload'

export type ReviewSummaryResult = {
  commonComplaints: string[]
  cons: string[]
  pros: string[]
  sentiment: number
  text: string
}

function parseReviewSummaryJson(raw: string): ReviewSummaryResult | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ReviewSummaryResult>
    if (typeof parsed.text !== 'string' || !parsed.text.trim()) return null

    return {
      commonComplaints: Array.isArray(parsed.commonComplaints)
        ? parsed.commonComplaints.filter((x): x is string => typeof x === 'string')
        : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.filter((x): x is string => typeof x === 'string') : [],
      pros: Array.isArray(parsed.pros) ? parsed.pros.filter((x): x is string => typeof x === 'string') : [],
      sentiment:
        typeof parsed.sentiment === 'number' && Number.isFinite(parsed.sentiment) ?
          Math.max(-1, Math.min(1, parsed.sentiment))
        : 0,
      text: parsed.text.trim(),
    }
  } catch {
    return null
  }
}

export async function generateReviewSummaryFromReviews(args: {
  productTitle: string
  reviews: Pick<ProductReview, 'rating' | 'title' | 'body'>[]
}): Promise<ReviewSummaryResult | null> {
  if (!isAiShoppingAssistantEnabled() || args.reviews.length === 0) return null

  const reviewLines = args.reviews
    .map((review, index) => {
      const headline = review.title?.trim() ? ` — ${review.title.trim()}` : ''
      return `${index + 1}. ${review.rating}/5${headline}: ${review.body.trim()}`
    })
    .join('\n')

  const completion = await callDeepSeekChat({
    messages: [
      {
        role: 'system',
        content: `You summarize ecommerce product reviews into structured JSON. Respond with ONLY valid JSON, no markdown fences.

Schema:
{
  "text": "2-3 sentence neutral summary",
  "sentiment": number between -1 and 1,
  "pros": ["string", ...],
  "cons": ["string", ...],
  "commonComplaints": ["string", ...]
}

Base the summary only on the reviews provided. Do not invent features.`,
      },
      {
        role: 'user',
        content: `Product: ${args.productTitle}\n\nReviews:\n${reviewLines}`,
      },
    ],
    tools: false,
  })

  const raw = completion.choices?.[0]?.message?.content?.trim()
  if (!raw) return null

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  return parseReviewSummaryJson(jsonMatch?.[0] ?? raw)
}

export async function syncProductReviewSummary(args: {
  payload: Payload
  productId: number
}): Promise<void> {
  const product = await args.payload.findByID({
    collection: 'products',
    depth: 0,
    id: args.productId,
    overrideAccess: true,
    select: { id: true, title: true, reviewCount: true },
  })

  if (!product) return

  const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : 0
  if (reviewCount === 0) {
    await args.payload.update({
      collection: 'products',
      context: { skipProductEmbedding: true, skipReviewSummary: true },
      data: {
        reviewSummary: {
          commonComplaints: [],
          cons: [],
          generatedAt: null,
          pros: [],
          reviewCountAtGeneration: 0,
          sentiment: null,
          text: null,
        },
      } as never,
      id: args.productId,
      overrideAccess: true,
    })
    return
  }

  const reviewsResult = await args.payload.find({
    collection: 'product-reviews',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      and: [
        { product: { equals: args.productId } },
        { moderationStatus: { equals: 'approved' } },
      ],
    },
  })

  const summary = await generateReviewSummaryFromReviews({
    productTitle: product.title ?? 'Product',
    reviews: reviewsResult.docs,
  })

  if (!summary) return

  await args.payload.update({
    collection: 'products',
    context: { skipProductEmbedding: true, skipReviewSummary: true },
    data: {
      reviewSummary: {
        commonComplaints: summary.commonComplaints.map((item) => ({ item })),
        cons: summary.cons.map((item) => ({ item })),
        generatedAt: new Date().toISOString(),
        pros: summary.pros.map((item) => ({ item })),
        reviewCountAtGeneration: reviewCount,
        sentiment: summary.sentiment,
        text: summary.text,
      },
    } as never,
    id: args.productId,
    overrideAccess: true,
  })
}

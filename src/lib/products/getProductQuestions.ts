import { getPayload } from 'payload'

import config from '@payload-config'
import type { ProductQuestion, User } from '@/payload-types'

export type ProductQuestionForJsonLd = {
  id: number
  question: string
  answer: string
  askedAt: string
  answeredAt: string
  askedBy?: string
  answeredBy?: string
}

function resolveAskedBy(question: ProductQuestion): string | undefined {
  if (question.askerDisplayName) return question.askerDisplayName
  const author = question.author
  if (author && typeof author === 'object') {
    const user = author as User
    return user.name ?? undefined
  }
  return undefined
}

/**
 * Server-side fetch of answered Q&A for a product, shaped for
 * `buildProductQAPageJsonLd`. Returns an empty array when there are no
 * answered questions so callers can detect and skip QAPage JSON-LD emission.
 */
export async function getProductQuestions(
  productId: number,
  options: { limit?: number } = {},
): Promise<ProductQuestionForJsonLd[]> {
  const { limit = 20 } = options
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'product-questions',
    depth: 1,
    limit,
    sort: '-answeredAt',
    where: {
      and: [
        { product: { equals: productId } },
        { status: { equals: 'answered' } },
        { answer: { exists: true } },
      ],
    },
  })

  const docs = (result.docs ?? []) as ProductQuestion[]

  return docs
    .filter((doc) => typeof doc.answer === 'string' && doc.answer.trim().length > 0)
    .filter((doc) => typeof doc.answeredAt === 'string' && doc.answeredAt.length > 0)
    .map((doc) => ({
      answer: (doc.answer ?? '').trim(),
      answeredAt: doc.answeredAt as string,
      askedAt: doc.createdAt,
      askedBy: resolveAskedBy(doc),
      id: doc.id,
      question: doc.question,
    }))
}

export type GeoFaq = { question: string; answer: string }

export type TaxonomySeoContent = {
  aiSummary?: string | null
  overview?: string | null
  buyingGuide?: string | null
  faqs?: { question?: string | null; answer?: string | null; id?: string | null }[] | null
}

export type PostSeoContent = {
  aiSummary?: string | null
  keyTakeaways?: { point?: string | null; id?: string | null }[] | null
  faqs?: { question?: string | null; answer?: string | null; id?: string | null }[] | null
}

export function getTaxonomySeoContent(doc: unknown): TaxonomySeoContent | null {
  if (!doc || typeof doc !== 'object') return null
  const seo = (doc as { seoContent?: TaxonomySeoContent }).seoContent
  return seo && typeof seo === 'object' ? seo : null
}

export function getPostSeoContent(doc: unknown): PostSeoContent | null {
  if (!doc || typeof doc !== 'object') return null
  const seo = (doc as { seoContent?: PostSeoContent }).seoContent
  return seo && typeof seo === 'object' ? seo : null
}

export function parseFaqs(
  faqs: TaxonomySeoContent['faqs'] | PostSeoContent['faqs'],
): GeoFaq[] {
  if (!Array.isArray(faqs)) return []
  return faqs
    .filter(
      (row): row is { question: string; answer: string } =>
        typeof row?.question === 'string' &&
        row.question.trim().length > 0 &&
        typeof row?.answer === 'string' &&
        row.answer.trim().length > 0,
    )
    .map((row) => ({ question: row.question.trim(), answer: row.answer.trim() }))
}

export function buildFaqJsonLd(url: string, faqs: GeoFaq[]) {
  if (faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

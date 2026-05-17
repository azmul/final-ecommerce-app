import type { PostSeoContent } from '@/lib/seo/resolveGeoContent'
import { parseFaqs } from '@/lib/seo/resolveGeoContent'

const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: 'Article',
  'buying-guide': 'Buying guide',
  comparison: 'Comparison',
  'how-to': 'How-to',
  faq: 'FAQ',
  trend: 'Trend',
}

export function BlogPostGeoSection({
  contentType,
  seoContent,
}: {
  contentType?: string | null
  seoContent: PostSeoContent | null
}) {
  if (!seoContent) return null

  const faqs = parseFaqs(seoContent.faqs)
  const takeaways =
    seoContent.keyTakeaways
      ?.map((row) => (typeof row?.point === 'string' ? row.point.trim() : ''))
      .filter(Boolean) ?? []

  const hasContent = seoContent.aiSummary?.trim() || takeaways.length > 0 || faqs.length > 0
  if (!hasContent) return null

  const typeLabel = contentType ? CONTENT_TYPE_LABELS[contentType] ?? contentType : null

  return (
    <section
      aria-labelledby="post-geo-heading"
      className="mb-10 rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6"
    >
      {typeLabel ?
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">{typeLabel}</p>
      : null}
      <h2 className="sr-only" id="post-geo-heading">
        Summary
      </h2>
      {seoContent.aiSummary?.trim() ?
        <p className="text-pretty text-base leading-relaxed text-foreground sm:text-lg">
          {seoContent.aiSummary.trim()}
        </p>
      : null}
      {takeaways.length > 0 ?
        <div className={seoContent.aiSummary?.trim() ? 'mt-6' : undefined}>
          <h3 className="text-sm font-semibold text-foreground">Key takeaways</h3>
          <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {takeaways.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      : null}
      {faqs.length > 0 ?
        <div className={seoContent.aiSummary?.trim() || takeaways.length > 0 ? 'mt-6' : undefined}>
          <h3 className="text-sm font-semibold text-foreground">FAQs</h3>
          <dl className="mt-3 divide-y divide-border/70 rounded-lg border border-border/60 bg-background">
            {faqs.map((faq) => (
              <div className="px-4 py-3" key={faq.question}>
                <dt className="font-medium text-foreground">{faq.question}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      : null}
    </section>
  )
}

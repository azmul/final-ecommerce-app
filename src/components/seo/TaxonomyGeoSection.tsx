import type { ReactNode } from 'react'

import type { TaxonomySeoContent } from '@/lib/seo/resolveGeoContent'
import { parseFaqs } from '@/lib/seo/resolveGeoContent'

export function TaxonomyGeoSection({
  title,
  seoContent,
}: {
  title: string
  seoContent: TaxonomySeoContent | null
}) {
  if (!seoContent) return null

  const faqs = parseFaqs(seoContent.faqs)
  const hasContent =
    seoContent.aiSummary?.trim() ||
    seoContent.overview?.trim() ||
    seoContent.buyingGuide?.trim() ||
    faqs.length > 0

  if (!hasContent) return null

  return (
    <section
      aria-labelledby="taxonomy-geo-heading"
      className="w-full min-w-0 rounded-2xl border border-border/70 bg-background p-4 sm:p-6 md:p-8 dark:border-border"
    >
      <header className="mb-6 space-y-2">
        <h2
          className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          id="taxonomy-geo-heading"
        >
          About {title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Overview and buying guidance for shoppers and search engines.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {seoContent.aiSummary?.trim() ?
          <Block title="Summary">
            <p className="text-pretty text-sm leading-relaxed text-foreground sm:text-base">
              {seoContent.aiSummary.trim()}
            </p>
          </Block>
        : null}

        {seoContent.overview?.trim() ?
          <Block title="Overview">
            <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-foreground sm:text-base">
              {seoContent.overview.trim()}
            </p>
          </Block>
        : null}

        {seoContent.buyingGuide?.trim() ?
          <Block title="Buying guide">
            <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-foreground sm:text-base">
              {seoContent.buyingGuide.trim()}
            </p>
          </Block>
        : null}

        {faqs.length > 0 ?
          <Block title="Frequently asked questions">
            <dl className="divide-y divide-border/80 rounded-xl border border-border/60">
              {faqs.map((faq) => (
                <div className="px-4 py-3 sm:px-5 sm:py-4" key={faq.question}>
                  <dt className="font-medium text-foreground">{faq.question}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </Block>
        : null}
      </div>
    </section>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

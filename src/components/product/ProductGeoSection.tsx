import type { ReactNode } from 'react'
import type { Product } from '@/payload-types'

import { sanitizeProductSeoText } from '@/lib/seo/sanitizeProductSeoText'

type SeoContent = {
  aiSummary?: string | null
  keyFeatures?: { feature?: string | null; id?: string | null }[] | null
  whyChooseThis?: string | null
  usageInfo?: string | null
  shippingReturnsNote?: string | null
  faqs?: { question?: string | null; answer?: string | null; id?: string | null }[] | null
}

function getSeoContent(product: Product): SeoContent | null {
  const content = (product as Product & { seoContent?: SeoContent }).seoContent
  return content && typeof content === 'object' ? content : null
}

export function productHasGeoContent(product: Product): boolean {
  const seo = getSeoContent(product)
  if (!seo) return false

  const features =
    seo.keyFeatures
      ?.map((row) => (typeof row?.feature === 'string' ? row.feature.trim() : ''))
      .filter(Boolean) ?? []

  const faqs =
    seo.faqs
      ?.filter(
        (row) =>
          typeof row?.question === 'string' &&
          row.question.trim() &&
          typeof row?.answer === 'string' &&
          row.answer.trim(),
      ) ?? []

  return Boolean(
    sanitizeProductSeoText(seo.aiSummary) ||
      features.length > 0 ||
      sanitizeProductSeoText(seo.whyChooseThis) ||
      sanitizeProductSeoText(seo.usageInfo) ||
      sanitizeProductSeoText(seo.shippingReturnsNote) ||
      faqs.length > 0,
  )
}

export function productHasDescriptionOrSpecs(product: Product): boolean {
  const specs =
    product.technicalSpecs?.some(
      (row) =>
        typeof row?.label === 'string' &&
        row.label.trim() &&
        typeof row?.value === 'string' &&
        row.value.trim(),
    ) ?? false

  return Boolean(product.description) || specs
}

type ProductGeoSectionProps = {
  embedded?: boolean
  product: Product
}

export function ProductGeoSection({ embedded = false, product }: ProductGeoSectionProps) {
  const seo = getSeoContent(product)
  if (!seo) return null

  const features =
    seo.keyFeatures
      ?.map((row) => (typeof row?.feature === 'string' ? row.feature.trim() : ''))
      .filter(Boolean) ?? []

  const faqs =
    seo.faqs
      ?.filter(
        (row) =>
          typeof row?.question === 'string' &&
          row.question.trim() &&
          typeof row?.answer === 'string' &&
          row.answer.trim(),
      )
      .map((row) => ({
        question: row!.question!.trim(),
        answer: row!.answer!.trim(),
      })) ?? []

  if (!productHasGeoContent(product)) return null

  const aiSummary = sanitizeProductSeoText(seo.aiSummary)
  const whyChooseThis = sanitizeProductSeoText(seo.whyChooseThis)
  const usageInfo = sanitizeProductSeoText(seo.usageInfo)
  const shippingReturnsNote = sanitizeProductSeoText(seo.shippingReturnsNote)

  const body = (
      <div className="flex flex-col gap-8">
        {aiSummary ?
          <Block title="Summary">
            <p className="text-pretty text-sm leading-relaxed text-foreground sm:text-base">
              {aiSummary}
            </p>
          </Block>
        : null}

        {features.length > 0 ?
          <Block title="Key features">
            <ul className="list-disc space-y-1.5 ps-5 text-sm leading-relaxed text-foreground sm:text-base">
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </Block>
        : null}

        {whyChooseThis ?
          <Block title="Why choose this?">
            <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-foreground sm:text-base">
              {whyChooseThis}
            </p>
          </Block>
        : null}

        {usageInfo ?
          <Block title="Usage & care">
            <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-foreground sm:text-base">
              {usageInfo}
            </p>
          </Block>
        : null}

        {shippingReturnsNote ?
          <Block title="Shipping & returns">
            <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-foreground sm:text-base">
              {shippingReturnsNote}
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
  )

  if (embedded) {
    return (
      <div className="min-w-0">
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Key facts to help you decide — useful for quick comparison and search.
        </p>
        {body}
      </div>
    )
  }

  return (
    <section
      aria-labelledby="product-geo-heading"
      className="w-full min-w-0 rounded-2xl border border-border/70 p-4 sm:p-6 md:p-8 dark:border-border"
    >
      <header className="mb-6 space-y-2">
        <h2
          className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          id="product-geo-heading"
        >
          Product details &amp; buying guide
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Key facts to help you decide — useful for quick comparison and search.
        </p>
      </header>
      {body}
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

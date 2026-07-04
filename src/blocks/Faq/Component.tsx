import type { FaqBlock as FaqBlockProps } from '@/payload-types'

import { JsonLd } from '@/lib/seo/JsonLd'
import { buildFaqJsonLd, parseFaqs } from '@/lib/seo/resolveGeoContent'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

import { FaqAccordion } from './Component.client'

export const FaqBlock: React.FC<FaqBlockProps> = (props) => {
  const items = parseFaqs(props.items)

  if (!items.length) return null

  const heading = props.heading?.trim() || 'Frequently asked questions'
  const faqJsonLd = buildFaqJsonLd('', items)

  return (
    <section aria-labelledby="faq-block-heading" className={cn(cmsBlockShellClassName, 'py-2 sm:py-4')}>
      <header className="mb-6 space-y-2">
        <h2
          className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          id="faq-block-heading"
        >
          {heading}
        </h2>
        {props.subheading?.trim() ?
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {props.subheading.trim()}
          </p>
        : null}
      </header>
      <FaqAccordion items={items} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
    </section>
  )
}

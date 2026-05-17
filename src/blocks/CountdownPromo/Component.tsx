import type { CountdownPromoBlock as CountdownPromoBlockProps } from '@/payload-types'

import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

import { CountdownPromoClient } from './Component.client'

export const CountdownPromoBlock: React.FC<CountdownPromoBlockProps> = (props) => {
  const ctaUrl = props.ctaUrl?.trim()
  const ctaLabel = props.ctaLabel?.trim() || 'Shop now'
  const headline = props.headline?.trim()
  const endDate = props.endDate

  if (!headline || !endDate || !ctaUrl) return null

  return (
    <section
      aria-label={headline}
      className={cn(cmsBlockShellClassName, 'py-2 sm:py-4')}
    >
      <CountdownPromoClient
        ctaLabel={ctaLabel}
        ctaUrl={ctaUrl}
        description={props.description}
        endDate={endDate}
        eyebrow={props.eyebrow}
        headline={headline}
        promoCode={props.promoCode}
        theme={props.theme}
      />
    </section>
  )
}

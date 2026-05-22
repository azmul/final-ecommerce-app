'use client'

import type { GeoFaq } from '@/lib/seo/resolveGeoContent'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/utilities/cn'

export function FaqAccordion({
  className,
  items,
}: {
  className?: string
  items: GeoFaq[]
}) {
  if (!items.length) return null

  return (
    <Accordion className={cn('w-full rounded-xl border border-border/60', className)} type="single" collapsible>
      {items.map((item, index) => (
        <AccordionItem key={`${item.question}-${index}`} value={`faq-${index}`}>
          <AccordionTrigger className="px-4 text-base sm:px-5">{item.question}</AccordionTrigger>
          <AccordionContent className="px-4 text-muted-foreground sm:px-5 sm:text-[15px]">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

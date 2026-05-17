import type { CampaignBannerStripBlock as CampaignBannerStripBlockProps } from '@/payload-types'

import { Button } from '@/components/ui/button'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const styleShell: Record<NonNullable<CampaignBannerStripBlockProps['style']>, string> = {
  gradient:
    'border-primary/20 bg-gradient-to-r from-primary via-primary/90 to-violet-600 text-primary-foreground shadow-md shadow-primary/15',
  bold: 'border-neutral-900 bg-neutral-950 text-white shadow-lg dark:border-neutral-700',
  subtle:
    'border-border bg-muted/60 text-foreground shadow-sm dark:bg-muted/40',
}

export const CampaignBannerStripBlock: React.FC<CampaignBannerStripBlockProps> = (props) => {
  const message = props.message?.trim()
  const ctaUrl = props.ctaUrl?.trim()
  const ctaLabel = props.ctaLabel?.trim() || 'Shop now'
  const highlight = props.highlight?.trim()
  const style = props.style ?? 'gradient'
  const isSubtle = style === 'subtle'

  if (!message || !ctaUrl) return null

  return (
    <section className={cn(cmsBlockShellClassName, 'py-2 sm:py-3')}>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border px-5 py-5 sm:px-8 sm:py-6',
          styleShell[style],
        )}
      >
        {!isSubtle ? (
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 top-1/2 size-32 -translate-y-1/2 rounded-full bg-white/10 blur-2xl"
          />
        ) : null}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <Sparkles
              aria-hidden
              className={cn(
                'mt-0.5 size-5 shrink-0 sm:mt-0',
                isSubtle ? 'text-primary' : 'text-white/90',
              )}
            />
            <p
              className={cn(
                'text-pretty text-base font-semibold leading-snug sm:text-lg',
                isSubtle && 'text-foreground',
              )}
            >
              {message}
              {highlight ? (
                <>
                  {' '}
                  <span
                    className={cn(
                      'font-bold',
                      isSubtle ? 'text-primary' : 'text-white underline decoration-white/40',
                    )}
                  >
                    {highlight}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <Button
            asChild
            className={cn(
              'h-10 shrink-0 gap-2 px-5 shadow-sm sm:h-11',
              isSubtle ?
                'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border-0 bg-white text-neutral-900 hover:bg-white/95',
            )}
            size="lg"
          >
            <Link href={ctaUrl}>
              {ctaLabel}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

import type { CampaignHeroBlock as CampaignHeroBlockProps, Media } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

async function resolveMedia(
  value: number | Media | null | undefined,
): Promise<Media | null> {
  if (value == null) return null
  if (typeof value === 'object') return value

  const payload = await getPayload({ config: configPromise })
  try {
    const doc = await payload.findByID({
      collection: 'media',
      depth: 0,
      id: value,
    })
    return doc as Media
  } catch {
    return null
  }
}

const overlayClass: Record<NonNullable<CampaignHeroBlockProps['overlay']>, string> = {
  gradient:
    'bg-gradient-to-r from-black/75 via-black/45 to-black/15 sm:bg-gradient-to-r sm:from-black/80 sm:via-black/50 sm:to-transparent',
  dark: 'bg-black/60',
  light: 'bg-white/55 backdrop-blur-[2px]',
}

export const CampaignHeroBlock: React.FC<CampaignHeroBlockProps> = async (props) => {
  const media = await resolveMedia(props.backgroundImage)
  if (!media) return null

  const overlay = props.overlay ?? 'gradient'
  const alignment = props.alignment ?? 'left'
  const isLightOverlay = overlay === 'light'
  const textTone = isLightOverlay ? 'text-foreground' : 'text-white'
  const mutedTone = isLightOverlay ? 'text-muted-foreground' : 'text-white/85'

  const primaryUrl = props.primaryUrl?.trim()
  const primaryLabel = props.primaryLabel?.trim()
  const secondaryUrl = props.secondaryUrl?.trim()
  const secondaryLabel = props.secondaryLabel?.trim()

  if (!primaryUrl || !primaryLabel) return null

  return (
    <section
      aria-label={props.headline}
      className={cn(cmsBlockShellClassName, 'py-2 sm:py-4')}
    >
      <div
        className={cn(
          'relative isolate min-h-[min(88vw,22rem)] overflow-hidden rounded-2xl border border-border/60 shadow-lg sm:min-h-[26rem] lg:min-h-[32rem]',
        )}
      >
        <MediaCmp
          className="absolute inset-0 size-full"
          fill
          imgClassName="object-cover"
          priority
          resource={media}
        />
        <div aria-hidden className={cn('absolute inset-0', overlayClass[overlay])} />
        <div
          className={cn(
            'relative z-10 flex min-h-[inherit] flex-col justify-end p-6 sm:p-10 lg:p-12',
            alignment === 'center' && 'items-center text-center',
          )}
        >
          <div
            className={cn(
              'max-w-2xl space-y-4 sm:space-y-5 lg:max-w-3xl',
              alignment === 'center' && 'mx-auto',
            )}
          >
            {props.eyebrow?.trim() ? (
              <p
                className={cn(
                  'inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest',
                  isLightOverlay ?
                    'border-primary/25 bg-primary/10 text-primary'
                  : 'border-white/30 bg-white/15 text-white backdrop-blur-sm',
                )}
              >
                {props.eyebrow.trim()}
              </p>
            ) : null}
            <h2
              className={cn(
                'text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl',
                textTone,
              )}
            >
              {props.headline}
            </h2>
            {props.description?.trim() ? (
              <p className={cn('max-w-xl text-pretty text-base sm:text-lg', mutedTone)}>
                {props.description.trim()}
              </p>
            ) : null}
            <div
              className={cn(
                'flex flex-wrap gap-3 pt-1 sm:gap-4',
                alignment === 'center' && 'justify-center',
              )}
            >
              <Button asChild className="h-11 px-6 text-sm shadow-md sm:h-12" size="lg">
                <Link href={primaryUrl}>{primaryLabel}</Link>
              </Button>
              {secondaryUrl && secondaryLabel ? (
                <Button
                  asChild
                  className={cn(
                    'h-11 px-6 text-sm sm:h-12',
                    isLightOverlay ?
                      'border-border bg-background/80 hover:bg-background'
                    : 'border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white',
                  )}
                  size="lg"
                  variant="outline"
                >
                  <Link href={secondaryUrl}>{secondaryLabel}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

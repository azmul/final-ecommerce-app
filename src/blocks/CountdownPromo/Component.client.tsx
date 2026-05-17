'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { Clock, Tag } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function getTimeLeft(endMs: number): TimeLeft {
  const diff = endMs - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds, expired: false }
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-[3.25rem] flex-col items-center rounded-xl border border-white/15 bg-black/20 px-2 py-2.5 backdrop-blur-sm sm:min-w-[4rem] sm:px-3 sm:py-3">
      <span className="font-mono text-2xl font-bold tabular-nums leading-none sm:text-3xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/70 sm:text-xs">
        {label}
      </span>
    </div>
  )
}

const themeShell: Record<string, string> = {
  primary:
    'border-primary/20 bg-gradient-to-br from-primary via-primary/90 to-primary/75 text-primary-foreground shadow-lg shadow-primary/20',
  dark: 'border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white shadow-lg',
  vibrant:
    'border-fuchsia-500/30 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-lg shadow-fuchsia-500/25',
}

type Props = {
  ctaLabel: string
  ctaUrl: string
  description?: string | null
  endDate: string
  eyebrow?: string | null
  headline: string
  promoCode?: string | null
  theme?: 'primary' | 'dark' | 'vibrant' | null
}

export function CountdownPromoClient({
  ctaLabel,
  ctaUrl,
  description,
  endDate,
  eyebrow,
  headline,
  promoCode,
  theme = 'primary',
}: Props) {
  const endMs = React.useMemo(() => new Date(endDate).getTime(), [endDate])
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(() => getTimeLeft(endMs))

  React.useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(endMs))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [endMs])

  const shell = themeShell[theme ?? 'primary'] ?? themeShell.primary

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 sm:p-8 lg:p-10',
        shell,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-white/10 blur-3xl"
      />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
        <div className="space-y-4">
          {eyebrow?.trim() ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/90">
              <Clock aria-hidden className="size-3.5" />
              {eyebrow.trim()}
            </p>
          ) : null}
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            {headline}
          </h2>
          {description?.trim() ? (
            <p className="max-w-lg text-pretty text-sm text-white/85 sm:text-base">
              {description.trim()}
            </p>
          ) : null}
          {promoCode?.trim() ? (
            <p className="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/35 bg-black/15 px-3 py-2 font-mono text-sm">
              <Tag aria-hidden className="size-4 shrink-0 opacity-80" />
              <span className="text-white/80">Use code</span>
              <span className="font-bold tracking-wide">{promoCode.trim()}</span>
            </p>
          ) : null}
          <Button
            asChild
            className="mt-2 h-11 border-0 bg-white px-6 text-sm font-semibold text-neutral-900 shadow-md hover:bg-white/95 sm:h-12"
            size="lg"
          >
            <Link href={ctaUrl}>{ctaLabel}</Link>
          </Button>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <p className="text-xs font-medium uppercase tracking-widest text-white/75">
            {timeLeft.expired ? 'Offer ended' : 'Time remaining'}
          </p>
          <div
            aria-live="polite"
            className="flex flex-wrap gap-2 sm:gap-2.5"
            role="timer"
          >
            <CountdownUnit label="Days" value={timeLeft.days} />
            <CountdownUnit label="Hrs" value={timeLeft.hours} />
            <CountdownUnit label="Min" value={timeLeft.minutes} />
            <CountdownUnit label="Sec" value={timeLeft.seconds} />
          </div>
        </div>
      </div>
    </div>
  )
}

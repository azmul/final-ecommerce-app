'use client'

import { cn } from '@/utilities/cn'
import { Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import React from 'react'

type ReviewSummary = {
  commonComplaints?: { item?: string | null }[] | null
  cons?: { item?: string | null }[] | null
  pros?: { item?: string | null }[] | null
  sentiment?: number | null
  text?: string | null
}

function listItems(items: { item?: string | null }[] | null | undefined): string[] {
  return (items ?? [])
    .map((row) => (typeof row.item === 'string' ? row.item.trim() : ''))
    .filter(Boolean)
}

function sentimentLabel(score: number | null | undefined): string {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 'Mixed'
  if (score >= 0.35) return 'Mostly positive'
  if (score <= -0.35) return 'Mostly negative'
  return 'Mixed'
}

type Props = {
  className?: string
  reviewSummary?: ReviewSummary | null
}

export function ProductReviewSummary({ className, reviewSummary }: Props) {
  if (!reviewSummary?.text?.trim()) return null

  const pros = listItems(reviewSummary.pros)
  const cons = listItems(reviewSummary.cons)
  const complaints = listItems(reviewSummary.commonComplaints)

  return (
    <section
      aria-label="AI review summary"
      className={cn(
        'rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5',
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles aria-hidden className="size-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          What customers say
        </h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          AI summary
        </span>
        <span className="text-xs text-muted-foreground">{sentimentLabel(reviewSummary.sentiment)}</span>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{reviewSummary.text.trim()}</p>

      {(pros.length > 0 || cons.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {pros.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                <ThumbsUp aria-hidden className="size-3.5" />
                Pros
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {pros.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
          {cons.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                <ThumbsDown aria-hidden className="size-3.5" />
                Cons
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {cons.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {complaints.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Common themes
          </p>
          <ul className="flex flex-wrap gap-2">
            {complaints.map((item) => (
              <li
                className="rounded-md bg-background px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

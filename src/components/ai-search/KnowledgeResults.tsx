'use client'

import type { KnowledgeChunkResult } from '@/components/ai-search/types'
import { cn } from '@/utilities/cn'
import { BookOpen, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  animate?: boolean
  chunks: KnowledgeChunkResult[]
  className?: string
}

export function KnowledgeResults({ animate = false, chunks, className }: Props) {
  if (!chunks.length) return null

  return (
    <div className={cn('space-y-2', className)}>
      {chunks.map((chunk, index) => (
        <article
          className={cn(
            'rounded-xl border border-border/80 bg-background/95 p-3 shadow-sm transition-shadow hover:shadow-md',
            animate &&
              'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500 motion-safe:ease-out',
          )}
          key={`${chunk.sourceType}-${chunk.sourceId}-${index}`}
          style={animate ? { animationDelay: `${120 + index * 90}ms` } : undefined}
        >
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {chunk.title ? (
                  <p className="text-xs font-semibold text-foreground">{chunk.title}</p>
                ) : null}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {chunk.sourceType}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(chunk.score * 100)}% match
                </span>
              </div>
              <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                {chunk.text}
              </p>
              {chunk.sourceUrl ? (
                <Link
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  href={chunk.sourceUrl}
                >
                  Read source
                  <ExternalLink className="size-3" />
                </Link>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

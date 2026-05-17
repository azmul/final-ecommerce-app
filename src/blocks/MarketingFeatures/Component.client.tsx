'use client'

import type { MarketingFeaturesBlock } from '@/payload-types'

import { cn } from '@/utilities/cn'
import {
  Gift,
  Headphones,
  Percent,
  Shield,
  Sparkles,
  Star,
  Truck,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const iconMap: Record<NonNullable<MarketingFeaturesBlock['items']>[number]['icon'], LucideIcon> = {
  truck: Truck,
  shield: Shield,
  sparkles: Sparkles,
  percent: Percent,
  gift: Gift,
  headphones: Headphones,
  star: Star,
  zap: Zap,
}

export type MarketingFeatureItem = {
  icon: NonNullable<MarketingFeaturesBlock['items']>[number]['icon']
  title: string
  description: string
  linkUrl?: string | null
  linkLabel?: string | null
}

const columnClass: Record<string, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

function FeatureCard({ item }: { item: MarketingFeatureItem }) {
  const Icon = iconMap[item.icon] ?? Sparkles
  const href = item.linkUrl?.trim()
  const linkLabel = item.linkLabel?.trim() || 'Learn more'

  const card = (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md',
      )}
    >
      <div
        aria-hidden
        className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary/30"
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      {href ? (
        <span className="text-sm font-medium text-primary transition group-hover:underline">
          {linkLabel} →
        </span>
      ) : null}
    </article>
  )

  if (href) {
    return (
      <Link className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring" href={href}>
        {card}
      </Link>
    )
  }

  return card
}

type Props = {
  columns?: string | null
  heading?: string | null
  items: MarketingFeatureItem[]
  subheading?: string | null
}

export function MarketingFeaturesClient({ columns = '3', heading, items, subheading }: Props) {
  if (!items.length) return null

  return (
    <div className="space-y-8 sm:space-y-10">
      {(heading?.trim() || subheading?.trim()) && (
        <header className="mx-auto max-w-2xl text-center">
          {heading?.trim() ? (
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              {heading.trim()}
            </h2>
          ) : null}
          {subheading?.trim() ? (
            <p className="mt-3 text-pretty text-muted-foreground sm:text-lg">{subheading.trim()}</p>
          ) : null}
        </header>
      )}
      <div className={cn('grid gap-4 sm:gap-5', columnClass[columns ?? '3'] ?? columnClass['3'])}>
        {items.map((item, index) => (
          <FeatureCard item={item} key={`${item.title}-${index}`} />
        ))}
      </div>
    </div>
  )
}

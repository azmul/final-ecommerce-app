'use client'

import type { Product } from '@/payload-types'
import { ProductQuestionsSection } from '@/components/product/ProductQuestionsSection'
import { ProductQuoteRequest } from '@/components/product/ProductQuoteRequest'
import { ProductReviewsSection } from '@/components/product/ProductReviewsSection'
import { cn } from '@/utilities/cn'
import { BookOpen, Building2, HelpCircle, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import React, { useId, useMemo, useState } from 'react'

type TabId = 'details' | 'quote' | 'qa' | 'reviews'

type ProductDetailTabsProps = {
  details: ReactNode | null
  product: Product
  productId: number
  reviewAverage: number | null | undefined
  reviewCount: number | null | undefined
  reviewSummary?: {
    commonComplaints?: { item?: string | null }[] | null
    cons?: { item?: string | null }[] | null
    pros?: { item?: string | null }[] | null
    sentiment?: number | null
    text?: string | null
  } | null
  showDetails: boolean
}

type TabConfig = {
  icon: React.ReactNode
  id: TabId
  label: string
  mobileLabel: string
  badge?: string
}

export function ProductDetailTabs({
  details,
  product,
  productId,
  reviewAverage,
  reviewCount,
  reviewSummary,
  showDetails,
}: ProductDetailTabsProps) {
  const baseId = useId()

  const tabs = useMemo(() => {
    const items: TabConfig[] = []

    if (showDetails) {
      items.push({
        icon: <BookOpen aria-hidden className="size-4 shrink-0" />,
        id: 'details',
        label: 'Details & guide',
        mobileLabel: 'Details',
      })
    }

    items.push(
      {
        icon: <Building2 aria-hidden className="size-4 shrink-0" />,
        id: 'quote',
        label: 'Bulk quote',
        mobileLabel: 'Quote',
      },
      {
        icon: <HelpCircle aria-hidden className="size-4 shrink-0" />,
        id: 'qa',
        label: 'Q&A',
        mobileLabel: 'Q&A',
      },
      {
        badge:
          typeof reviewAverage === 'number' && !Number.isNaN(reviewAverage) && reviewCount ?
            reviewAverage.toFixed(1)
          : undefined,
        icon: <Star aria-hidden className="size-4 shrink-0" />,
        id: 'reviews',
        label: 'Reviews',
        mobileLabel: 'Reviews',
      },
    )

    return items
  }, [reviewAverage, reviewCount, showDetails])

  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? 'quote')

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
  const safeActiveTab = activeIndex === -1 ? (tabs[0]?.id ?? 'quote') : activeTab

  function focusTab(index: number) {
    const tab = tabs[index]
    if (tab) setActiveTab(tab.id)
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusTab((index + 1) % tabs.length)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusTab((index - 1 + tabs.length) % tabs.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusTab(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusTab(tabs.length - 1)
    }
  }

  return (
    <section
      aria-label="Product information"
      className="w-full min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm dark:border-border"
    >
      <div className="border-b border-border/70 bg-muted/10 px-1 sm:px-3">
        <div
          aria-label="Product information sections"
          className="flex snap-x snap-mandatory gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:py-3 [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {tabs.map((tab, index) => {
            const selected = safeActiveTab === tab.id
            const tabId = `${baseId}-${tab.id}-tab`
            const panelId = `${baseId}-${tab.id}-panel`

            return (
              <button
                key={tab.id}
                aria-controls={panelId}
                aria-selected={selected}
                className={cn(
                  'inline-flex min-h-11 shrink-0 snap-start touch-manipulation items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all sm:min-h-10 sm:gap-2 sm:px-4',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  selected ?
                    'bg-background text-foreground shadow-sm ring-1 ring-border/80'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                )}
                id={tabId}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                role="tab"
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                {tab.icon}
                <span className="whitespace-nowrap sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden whitespace-nowrap sm:inline">{tab.label}</span>
                {tab.badge ?
                  <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-semibold text-primary">
                    {tab.badge}
                  </span>
                : null}
              </button>
            )
          })}
        </div>
      </div>

      {tabs.map((tab) => {
        const selected = safeActiveTab === tab.id
        const tabId = `${baseId}-${tab.id}-tab`
        const panelId = `${baseId}-${tab.id}-panel`

        return (
          <div
            key={tab.id}
            aria-labelledby={tabId}
            className={cn(
              'min-w-0 p-4 sm:p-6',
              selected ? 'block' : 'hidden',
            )}
            id={panelId}
            role="tabpanel"
            tabIndex={0}
          >
            {tab.id === 'details' && details}
            {tab.id === 'quote' && <ProductQuoteRequest embedded product={product} />}
            {tab.id === 'qa' && <ProductQuestionsSection embedded productId={productId} />}
            {tab.id === 'reviews' && (
              <ProductReviewsSection
                embedded
                productId={productId}
                reviewSummary={reviewSummary}
                storefrontAverage={reviewAverage}
                storefrontCount={reviewCount}
              />
            )}
          </div>
        )
      })}
    </section>
  )
}

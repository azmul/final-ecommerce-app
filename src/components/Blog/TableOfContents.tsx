'use client'

import React from 'react'

import { cn } from '@/utilities/cn'

export type TocItem = { id: string; level: 2 | 3; text: string }

const MAX_HEADINGS = 30

/**
 * Convert arbitrary text into a stable, URL-safe, kebab-case slug.
 * - Lowercases
 * - Strips non-alphanumeric chars (keeps spaces/hyphens then collapses them)
 * - Collapses whitespace + hyphens into single hyphens
 */
function slugify(input: string): string {
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Recursively pull the concatenated text out of a Lexical-style element node.
 * Robust against arbitrary node shapes — we only read `text` / `children`.
 */
function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: unknown; children?: unknown }

  if (typeof n.text === 'string') return n.text

  if (Array.isArray(n.children)) {
    return n.children.map(extractText).join('')
  }

  return ''
}

/**
 * Walk a Lexical / Payload rich-text root and return an ordered list of
 * H2/H3 headings with auto-generated kebab-case ids based on text.
 *
 * Non-heading nodes and headings outside H2/H3 are robustly skipped.
 * Returns at most `MAX_HEADINGS` entries.
 */
export function extractHeadings(content: unknown): TocItem[] {
  if (!content || typeof content !== 'object') return []

  // Accept both `SerializedEditorState` ({ root: { children } }) and a bare root.
  const root =
    (content as { root?: unknown }).root ?? (content as Record<string, unknown>)
  if (!root || typeof root !== 'object') return []

  const children = (root as { children?: unknown }).children
  if (!Array.isArray(children)) return []

  const items: TocItem[] = []
  const seenIds = new Map<string, number>()

  const visit = (nodes: unknown[]): void => {
    for (const node of nodes) {
      if (items.length >= MAX_HEADINGS) return
      if (!node || typeof node !== 'object') continue

      const n = node as {
        type?: unknown
        tag?: unknown
        children?: unknown
      }

      if (n.type === 'heading' && (n.tag === 'h2' || n.tag === 'h3')) {
        const text = extractText(n).trim()
        if (text) {
          const baseId = slugify(text) || `heading-${items.length + 1}`
          const count = seenIds.get(baseId) ?? 0
          const id = count === 0 ? baseId : `${baseId}-${count}`
          seenIds.set(baseId, count + 1)

          items.push({
            id,
            level: n.tag === 'h2' ? 2 : 3,
            text,
          })
        }
        // Headings don't nest other headings — no descent needed.
        continue
      }

      // Recurse into any other element-like node that has children.
      if (Array.isArray(n.children) && n.children.length > 0) {
        visit(n.children)
      }
    }
  }

  visit(children)
  return items
}

type Props = {
  className?: string
  items: TocItem[]
}

/**
 * Sticky sidebar Table of Contents.
 *
 * - Server-friendly props: pass `items` produced by `extractHeadings` so the
 *   markup is in the initial HTML for fast LCP.
 * - Client-only behavior: IntersectionObserver highlights the section the
 *   reader is currently viewing.
 * - On screens < md, the list is collapsed inside a <details> element.
 */
export default function TableOfContents({ className, items }: Props) {
  const [activeId, setActiveId] = React.useState<string | null>(
    items[0]?.id ?? null,
  )

  React.useEffect(() => {
    if (typeof window === 'undefined' || items.length === 0) return

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    // Track which sections are currently visible. Whenever the set changes,
    // pick the first one (top-most in document order) as the active id.
    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id)
          } else {
            visible.delete(entry.target.id)
          }
        }

        if (visible.size === 0) return

        for (const item of items) {
          if (visible.has(item.id)) {
            setActiveId(item.id)
            return
          }
        }
      },
      {
        // Trigger when the heading enters the top portion of the viewport.
        rootMargin: '0px 0px -65% 0px',
        threshold: [0, 1],
      },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  const list = (
    <ol className="mt-4 flex flex-col gap-1.5 border-l border-border">
      {items.map((item) => {
        const isActive = item.id === activeId
        return (
          <li
            key={item.id}
            className={cn(
              'leading-snug',
              item.level === 3 ? 'pl-6' : 'pl-3',
            )}
          >
            <a
              href={`#${item.id}`}
              aria-current={isActive ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l-2 py-1 pl-3 text-sm transition-colors',
                'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm',
                isActive
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              {item.text}
            </a>
          </li>
        )
      })}
    </ol>
  )

  return (
    <nav
      aria-label="Table of contents"
      className={cn('w-full', className)}
    >
      {/* Mobile: collapsible */}
      <details className="group rounded-md border border-border bg-background/60 md:hidden">
        <summary
          className={cn(
            'flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3',
            'text-sm font-semibold tracking-tight text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            '[&::-webkit-details-marker]:hidden',
          )}
        >
          <span>On this page</span>
          <svg
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </summary>
        <div className="px-4 pb-4">{list}</div>
      </details>

      {/* Desktop: sticky sidebar */}
      <div className="hidden md:block md:sticky md:top-24">
        <h2 className="text-sm font-semibold tracking-tight text-foreground lg:text-[0.825rem]">
          On this page
        </h2>
        {list}
      </div>
    </nav>
  )
}

'use client'

import React, { useId, useMemo, useState } from 'react'

const TRUNCATE_AT = 280

type Props = {
  text: string
}

export function BrandReadMore({ text }: Props) {
  const descriptionId = useId()

  const { needsTruncate, truncated, full } = useMemo(() => {
    const trimmed = text.trim()
    if (trimmed.length <= TRUNCATE_AT) {
      return {
        needsTruncate: false as const,
        truncated: trimmed,
        full: trimmed,
      }
    }

    const sliceEnd = trimmed.slice(0, TRUNCATE_AT)
    const lastSpace = sliceEnd.lastIndexOf(' ')
    const cut = lastSpace > 40 ? sliceEnd.slice(0, lastSpace) : sliceEnd.trimEnd()

    return {
      needsTruncate: true as const,
      truncated: `${cut.trimEnd()}…`,
      full: trimmed,
    }
  }, [text])

  const [expanded, setExpanded] = useState(false)

  if (!full) {
    return null
  }

  return (
    <div className="min-w-0 space-y-3 text-muted-foreground">
      <div
        className="font-serif text-[15px] leading-relaxed sm:text-base md:text-[17px]"
        id={descriptionId}
      >
        {needsTruncate && !expanded ? truncated : full}
      </div>
      {needsTruncate ? (
        <button
          aria-expanded={expanded}
          className="text-sm font-semibold text-primary transition hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setExpanded((e) => !e)}
          type="button"
        >
          {expanded ? 'Show less' : 'Read More'}
        </button>
      ) : null}
    </div>
  )
}

'use client'

import { ChevronDownIcon } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { ListItem } from '.'

import { FilterItem } from './FilterItem'

function activeListItemTitle(
  list: ListItem[],
  pathname: string,
  sortParam: string | null,
): string {
  for (const listItem of list) {
    if ('path' in listItem && pathname === listItem.path) {
      return listItem.title
    }
    if ('slug' in listItem && !('path' in listItem)) {
      const matches =
        listItem.slug == null
          ? sortParam == null || sortParam === ''
          : sortParam === listItem.slug
      if (matches) return listItem.title
    }
  }
  const firstSort = list.find((i): boolean => 'slug' in i && !('path' in i))
  if (firstSort && 'title' in firstSort) return firstSort.title
  return list[0]?.title ?? ''
}

export function FilterItemDropdown({ list }: { list: ListItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sortParam = searchParams.get('sort')
  const activeLabel = useMemo(
    () => activeListItemTitle(list, pathname, sortParam),
    [list, pathname, sortParam],
  )
  const [openSelect, setOpenSelect] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSelect(false)
      }
    }

    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div
        aria-expanded={openSelect}
        className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50 sm:min-h-11 sm:px-4 sm:py-2.5"
        onClick={() => {
          setOpenSelect(!openSelect)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpenSelect(!openSelect)
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="min-w-0 truncate text-left">{activeLabel}</div>
        <ChevronDownIcon className="h-4 shrink-0" aria-hidden />
      </div>
      {openSelect ? (
        <div
          className="absolute left-0 z-40 mt-1 min-w-full w-max max-w-[min(100vw-2rem,16rem)] max-h-[min(70vh,24rem)] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-lg"
          onClick={() => {
            setOpenSelect(false)
          }}
        >
          {list.map((item: ListItem, i) => (
            <FilterItem item={item} key={i} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

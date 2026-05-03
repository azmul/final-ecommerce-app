import type { SortFilterItem } from '@/lib/constants'

import React, { Suspense } from 'react'

import { FilterItemDropdown } from './FilterItemDropdown'
export type ListItem = PathFilterItem | SortFilterItem
export type PathFilterItem = { path: string; title: string }

export function FilterList({ list, title }: { list: ListItem[]; title?: string }) {
  return (
    <React.Fragment>
      <nav>
        {title ? (
          <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
        ) : null}
        <Suspense fallback={null}>
          <FilterItemDropdown list={list} />
        </Suspense>
      </nav>
    </React.Fragment>
  )
}

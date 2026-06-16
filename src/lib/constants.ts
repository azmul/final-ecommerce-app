export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Default Sorting',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
  { slug: 'priceInBDT', reverse: false, title: 'Price: Low to high' }, // asc
  { slug: '-priceInBDT', reverse: true, title: 'Price: High to low' },
]

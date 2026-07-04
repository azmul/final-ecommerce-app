type ItemListEntry = {
  name: string
  url: string
  image?: string
  position: number
}

export function buildItemListJsonLd(options: {
  name: string
  description?: string
  url: string
  items: ItemListEntry[]
  dateModified?: string | Date
  /** schema.org type of each list item. Defaults to Product (shop listings). */
  itemType?: 'Product' | 'BlogPosting'
}) {
  const { name, description, url, items, itemType = 'Product' } = options

  if (items.length === 0) return null

  const dateModified =
    options.dateModified instanceof Date ?
      options.dateModified.toISOString()
    : options.dateModified

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description ? { description } : {}),
    url,
    ...(dateModified ? { dateModified } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      item: {
        '@type': itemType,
        name: item.name,
        url: item.url,
        ...(item.image ? { image: item.image } : {}),
      },
    })),
  }
}

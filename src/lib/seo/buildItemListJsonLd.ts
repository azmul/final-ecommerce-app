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
}) {
  const { name, description, url, items } = options

  if (items.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description ? { description } : {}),
    url,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url,
        ...(item.image ? { image: item.image } : {}),
      },
    })),
  }
}

export function buildCollectionPageJsonLd(options: {
  name: string
  description?: string
  url: string
  dateModified?: string | Date
}) {
  const dateModified =
    options.dateModified instanceof Date ?
      options.dateModified.toISOString()
    : options.dateModified

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    url: options.url,
    ...(dateModified ? { dateModified } : {}),
    isPartOf: {
      '@type': 'WebSite',
      url: options.url.split('/shop')[0] || options.url,
    },
  }
}

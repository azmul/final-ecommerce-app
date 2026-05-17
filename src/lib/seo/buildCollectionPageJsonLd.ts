export function buildCollectionPageJsonLd(options: {
  name: string
  description?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    url: options.url,
    isPartOf: {
      '@type': 'WebSite',
      url: options.url.split('/shop')[0] || options.url,
    },
  }
}

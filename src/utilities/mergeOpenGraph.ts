import type { Metadata } from 'next'

const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Shop quality products with a fast, accessible checkout experience.',
  siteName,
  title: siteName,
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  const ogImages = og?.images
  const images =
    ogImages === undefined ?
      undefined
    : Array.isArray(ogImages) ?
      ogImages.length ? ogImages : undefined
    : ogImages

  return {
    ...defaultOpenGraph,
    ...og,
    title: og?.title ?? defaultOpenGraph.title,
    description: og?.description ?? defaultOpenGraph.description,
    siteName: og?.siteName ?? defaultOpenGraph.siteName,
    images,
  }
}

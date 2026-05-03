import type { Metadata } from 'next'

import type { Page, Post, Product } from '../payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

export const generateMeta = async (args: {
  doc: Page | Post | Product | null | undefined
  pathname?: string
}): Promise<Metadata> => {
  const { doc, pathname } = args || {}

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''

  const ogImageFromMeta =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    `${baseUrl}${doc.meta.image.url}`

  const ogImageFromFeatured =
    doc &&
    'featuredImage' in doc &&
    doc.featuredImage &&
    typeof doc.featuredImage === 'object' &&
    doc.featuredImage !== null &&
    'url' in doc.featuredImage &&
    doc.featuredImage.url
      ? `${baseUrl}${doc.featuredImage.url}`
      : undefined

  const ogImage = ogImageFromMeta || ogImageFromFeatured

  const relativePath =
    pathname ??
    (typeof doc?.slug === 'string' && doc.slug
      ? doc.slug === 'home'
        ? '/'
        : `/${doc.slug}`
      : Array.isArray(doc?.slug)
        ? `/${doc.slug.join('/')}`
        : '/')

  const canonicalUrl = relativePath.startsWith('http')
    ? relativePath
    : `${getServerSideURL()}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      ...(doc?.meta?.description
        ? {
            description: doc?.meta?.description,
          }
        : {}),
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title: doc?.meta?.title || doc?.title || 'Payload Ecommerce Template',
      url: canonicalUrl,
    }),
    title: doc?.meta?.title || doc?.title || 'Payload Ecommerce Template',
  }
}

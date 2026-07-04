import type { Metadata } from 'next'

import type { Page, Post, Product } from '../payload-types'

import { getServerSideURL, toAbsoluteUrl } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'
import { parseYoutubeVideoId, youtubeThumbnailSrc } from './youtube'

const defaultSiteTitle = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'

function docHeading(
  doc: Page | Post | Product | null | undefined,
): string | undefined {
  if (!doc) return undefined
  if (typeof doc.title === 'string' && doc.title.trim()) return doc.title.trim()
  return undefined
}

export const generateMeta = async (args: {
  doc: Page | Post | Product | null | undefined
  pathname?: string
}): Promise<Metadata> => {
  const { doc, pathname } = args || {}

  const ogImageFromMeta =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    typeof doc.meta.image.url === 'string'
      ? toAbsoluteUrl(doc.meta.image.url)
      : undefined

  const ogImageFromFeatured =
    doc &&
    'featuredImage' in doc &&
    doc.featuredImage &&
    typeof doc.featuredImage === 'object' &&
    doc.featuredImage !== null &&
    'url' in doc.featuredImage &&
    typeof doc.featuredImage.url === 'string'
      ? toAbsoluteUrl(doc.featuredImage.url)
      : undefined

  const ytUrlRaw =
    doc && 'featuredYoutubeUrl' in doc && typeof doc.featuredYoutubeUrl === 'string'
      ? doc.featuredYoutubeUrl
      : undefined
  const ytIdFeatured = parseYoutubeVideoId(ytUrlRaw)
  const ogImageFromFeaturedYoutube = ytIdFeatured ? youtubeThumbnailSrc(ytIdFeatured) : undefined

  const ogImage = ogImageFromMeta || ogImageFromFeaturedYoutube || ogImageFromFeatured

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

  const title = doc?.meta?.title || docHeading(doc) || defaultSiteTitle
  const rawExcerpt = doc && 'excerpt' in doc ? (doc as { excerpt?: string | null }).excerpt : undefined
  const excerpt = typeof rawExcerpt === 'string' ? rawExcerpt.trim() : ''

  const description = doc?.meta?.description?.trim() || excerpt || `${title} — ${defaultSiteTitle}`

  return {
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-BD': canonicalUrl,
        'x-default': canonicalUrl,
      },
    },
    description,
    openGraph: mergeOpenGraph({
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: canonicalUrl,
    }),
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: ogImage ? [ogImage] : undefined,
      title,
    },
  }
}

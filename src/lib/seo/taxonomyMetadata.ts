import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

type TaxonomyMeta = {
  title: string
  meta?: {
    title?: string | null
    description?: string | null
    image?: { url?: string | null; alt?: string | null } | number | null
  } | null
  fallbackDescription: string
  canonicalPath: string
  pageTitleSuffix: string
}

export function taxonomyMetadata({
  title,
  meta,
  fallbackDescription,
  canonicalPath,
  pageTitleSuffix,
}: TaxonomyMeta): Metadata {
  const base = getServerSideURL()
  const canonicalUrl = `${base}${canonicalPath}`
  const metaTitle =
    (typeof meta?.title === 'string' && meta.title.trim()) || `${title} · ${pageTitleSuffix}`
  const description =
    (typeof meta?.description === 'string' && meta.description.trim()) || fallbackDescription

  const metaImageResource =
    meta?.image && typeof meta.image === 'object' ? meta.image : null
  const metaImage =
    metaImageResource?.url ? toAbsoluteUrl(metaImageResource.url) : undefined

  return {
    alternates: { canonical: canonicalUrl },
    description,
    openGraph: mergeOpenGraph({
      description,
      images:
        metaImage ?
          [{ alt: metaImageResource?.alt || title, url: metaImage }]
        : undefined,
      title: metaTitle,
      url: canonicalUrl,
    }),
    other: {
      'ai-summary': description,
    },
    title: metaTitle,
    twitter: {
      card: 'summary_large_image',
      description,
      images: metaImage ? [metaImage] : undefined,
      title: metaTitle,
    },
  }
}

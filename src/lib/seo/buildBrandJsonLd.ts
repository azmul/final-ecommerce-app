import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { lexicalPlainText } from '@/lib/richtext/lexicalPlainText'
import { toAbsoluteUrl } from '@/utilities/getURL'

type MediaLike = { url?: string | null } | number | null | undefined

export interface BuildBrandJsonLdArgs {
  brand: {
    id?: string | number
    name: string
    slug: string
    description?: string | SerializedEditorState | null
    image?: MediaLike
    logo?: MediaLike
    foundedDate?: string | null
    officialWebsite?: string | null
    sameAs?: Array<{ url: string }> | null
    headquarters?: string | null
    areaServed?: string | null
    warrantyPolicy?: string | SerializedEditorState | null
  }
  /** Absolute URL of /brand/{slug}. */
  brandUrl: string
}

function resolveMediaUrl(media: MediaLike): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  if (typeof media.url !== 'string' || !media.url.trim()) return undefined
  return toAbsoluteUrl(media.url)
}

function resolveDescription(
  description: BuildBrandJsonLdArgs['brand']['description'],
): string | undefined {
  if (!description) return undefined
  if (typeof description === 'string') {
    const trimmed = description.trim()
    if (!trimmed) return undefined
    return trimmed.length <= 280 ? trimmed : `${trimmed.slice(0, 280).trimEnd()}…`
  }
  return lexicalPlainText(description, 280) ?? undefined
}

export function buildBrandJsonLd(args: BuildBrandJsonLdArgs): Record<string, unknown> {
  const { brand, brandUrl } = args

  const description = resolveDescription(brand.description)
  const imageUrl = resolveMediaUrl(brand.image)
  const logoUrl = resolveMediaUrl(brand.logo) ?? imageUrl

  const sameAs = [
    brand.officialWebsite,
    ...((brand.sameAs ?? []).map((s) => s.url)),
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  return {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    '@id': `${brandUrl}#brand`,
    name: brand.name,
    url: brandUrl,
    ...(description ? { description } : {}),
    ...(logoUrl ? { logo: logoUrl } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(brand.foundedDate ? { foundedDate: brand.foundedDate } : {}),
    ...(brand.areaServed ? { areaServed: brand.areaServed } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(brand.headquarters ?
      {
        address: {
          '@type': 'PostalAddress',
          addressLocality: brand.headquarters,
        },
      }
    : {}),
  }
}

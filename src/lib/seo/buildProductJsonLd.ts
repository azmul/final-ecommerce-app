import type { Category, Media, Product } from '@/payload-types'

import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

type ProductFaq = { question: string; answer: string }

type ProductWithSeo = Product & {
  seoContent?: {
    aiSummary?: string | null
    faqs?: { question?: string | null; answer?: string | null }[] | null
  }
}

function resolveFaqs(product: Product): ProductFaq[] {
  const faqs = (product as ProductWithSeo).seoContent?.faqs
  if (!Array.isArray(faqs)) return []
  return faqs
    .filter(
      (row): row is { question: string; answer: string } =>
        typeof row?.question === 'string' &&
        row.question.trim().length > 0 &&
        typeof row?.answer === 'string' &&
        row.answer.trim().length > 0,
    )
    .map((row) => ({ question: row.question.trim(), answer: row.answer.trim() }))
}

export function buildProductJsonLd(product: Product, slug: string) {
  const base = getServerSideURL()
  const productPageUrl = `${base}/products/${slug}`

  const gallery =
    product.gallery?.filter((item) => typeof item.image === 'object') || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined

  let price: number | undefined =
    typeof product.priceInBDT === 'number' ? product.priceInBDT : undefined
  if (product.enableVariants && product?.variants?.docs?.length) {
    price = product.variants.docs.reduce<number | undefined>((acc, variant) => {
      const variantPrice = variant && typeof variant === 'object' ? variant.priceInBDT : undefined
      if (typeof variantPrice === 'number' && (typeof acc !== 'number' || variantPrice > acc)) {
        return variantPrice
      }
      return acc
    }, price)
  }

  const hasStock = product.enableVariants
    ? Boolean(
        product.variants?.docs?.some((variant) => {
          if (!variant || typeof variant !== 'object') return false
          return (variant.inventory ?? 0) > 0
        }),
      )
    : (product.inventory ?? 0) > 0

  const descriptionText =
    (product as ProductWithSeo).seoContent?.aiSummary?.trim() ||
    (typeof product.meta?.description === 'string' && product.meta.description.trim()) ||
    `Shop ${product.title} online in Bangladesh.`

  const imageUrls = gallery
    .map((item) => {
      const img = item.image as Media
      return img?.url ? toAbsoluteUrl(img.url) : undefined
    })
    .filter((u): u is string => Boolean(u))

  const productImages =
    imageUrls.length ? imageUrls
    : metaImage?.url ? [toAbsoluteUrl(metaImage.url)!]
    : undefined

  const brandName =
    product.brand && typeof product.brand === 'object' && typeof product.brand.title === 'string' ?
      product.brand.title
    : undefined

  const primaryCategory =
    product.categories?.find((c): c is Category => typeof c === 'object') ?? null

  const categoryLabel =
    primaryCategory && typeof primaryCategory.title === 'string' ? primaryCategory.title : undefined

  const faqs = resolveFaqs(product)

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productPageUrl}#product`,
    name: product.title,
    description: descriptionText,
    url: productPageUrl,
    sku: slug,
    ...(brandName ?
      {
        brand: {
          '@type': 'Brand',
          name: brandName,
        },
      }
    : {}),
    ...(categoryLabel ? { category: categoryLabel } : {}),
    ...(productImages ? { image: productImages } : {}),
    offers: {
      '@type': 'Offer',
      url: productPageUrl,
      priceCurrency: 'BDT',
      ...(typeof price === 'number' ? { price: String(price) } : {}),
      availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: process.env.COMPANY_NAME || process.env.SITE_NAME || 'Store',
      },
    },
    ...(typeof product.reviewCount === 'number' &&
    product.reviewCount > 0 &&
    typeof product.reviewAverageRating === 'number' &&
    !Number.isNaN(product.reviewAverageRating) ?
      {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.reviewAverageRating,
          reviewCount: product.reviewCount,
          ratingCount: product.reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }
    : {}),
  }

  const graphs: Record<string, unknown>[] = [productSchema]

  if (faqs.length > 0) {
    graphs.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${productPageUrl}#faq`,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    })
  }

  return graphs
}

export function buildProductBreadcrumbJsonLd(
  product: Product,
  slug: string,
): Record<string, unknown> {
  const base = getServerSideURL()
  const productPageUrl = `${base}/products/${slug}`
  const primaryCategory =
    product.categories?.find((c): c is Category => typeof c === 'object') ?? null

  const items = [
    { name: 'Home', item: `${base}/` },
    { name: 'Shop', item: `${base}/shop` },
    ...(primaryCategory && typeof primaryCategory.slug === 'string' ?
      [
        {
          name: primaryCategory.title,
          item: `${base}/shop/${primaryCategory.slug}`,
        },
      ]
    : []),
    { name: product.title, item: productPageUrl },
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  }
}

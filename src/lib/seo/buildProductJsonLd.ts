import type { Category, Media, Product } from '@/payload-types'

import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

type ProductFaq = { question: string; answer: string }

/** Approved review shaped for schema.org `Review`. */
export type ProductReviewForJsonLd = {
  author: string
  rating: number
  body: string
  title?: string | null
  datePublished?: string | null
}

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

export function buildProductJsonLd(
  product: Product,
  slug: string,
  reviews: ProductReviewForJsonLd[] = [],
) {
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

  // Collect all variant prices for AggregateOffer support.
  const variantPrices: number[] =
    product.enableVariants && product?.variants?.docs?.length ?
      product.variants.docs
        .map((variant) =>
          variant && typeof variant === 'object' && typeof variant.priceInBDT === 'number' ?
            variant.priceInBDT
          : undefined,
        )
        .filter((p): p is number => typeof p === 'number')
    : []
  const lowPrice = variantPrices.length ? Math.min(...variantPrices) : undefined
  const highPrice = variantPrices.length ? Math.max(...variantPrices) : undefined
  const useAggregateOffer = variantPrices.length > 1 && lowPrice !== highPrice

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

  // Offers without a price-validity horizon trigger a Merchant/Search Console
  // warning. Default to ~1 year out (date only, per schema.org guidance).
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const cleanReviews = reviews
    .filter(
      (r) =>
        r.rating !== null &&
        r.rating !== undefined &&
        typeof r.rating === 'number' &&
        r.rating > 0 &&
        Boolean(r.body?.trim()),
    )
    .slice(0, 10)

  const identifiers = product.identifiers ?? {}
  const sku = typeof identifiers.sku === 'string' && identifiers.sku.trim() ? identifiers.sku.trim() : undefined
  const gtin = typeof identifiers.gtin === 'string' && identifiers.gtin.trim() ? identifiers.gtin.trim() : undefined
  const gtin13 = typeof identifiers.gtin13 === 'string' && identifiers.gtin13.trim() ? identifiers.gtin13.trim() : undefined
  const mpn = typeof identifiers.mpn === 'string' && identifiers.mpn.trim() ? identifiers.mpn.trim() : undefined

  const dateModified =
    typeof product.updatedAt === 'string' && product.updatedAt ?
      new Date(product.updatedAt).toISOString()
    : undefined
  const datePublished =
    typeof product.createdAt === 'string' && product.createdAt ?
      new Date(product.createdAt).toISOString()
    : undefined

  const availability = hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'BDT' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BD' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' },
    },
  }

  const hasMerchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'BD',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  }

  const sellerName = process.env.COMPANY_NAME || process.env.SITE_NAME || 'Store'

  const offersNode: Record<string, unknown> =
    useAggregateOffer ?
      {
        '@type': 'AggregateOffer',
        lowPrice: String(lowPrice),
        highPrice: String(highPrice),
        offerCount: variantPrices.length,
        priceCurrency: 'BDT',
        availability,
        url: productPageUrl,
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: sellerName },
        shippingDetails,
        hasMerchantReturnPolicy,
      }
    : {
        '@type': 'Offer',
        url: productPageUrl,
        priceCurrency: 'BDT',
        ...(typeof price === 'number' ? { price: String(price), priceValidUntil } : {}),
        availability,
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: sellerName },
        shippingDetails,
        hasMerchantReturnPolicy,
      }

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productPageUrl}#product`,
    name: product.title,
    description: descriptionText,
    url: productPageUrl,
    sku: sku ?? slug,
    ...(gtin13 ? { gtin13 } : {}),
    ...(gtin ? { gtin } : {}),
    ...(mpn ? { mpn } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
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
    offers: offersNode,
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
    ...(cleanReviews.length ?
      {
        review: cleanReviews.map((r) => ({
          '@type': 'Review',
          reviewRating: {
            '@type': 'Rating',
            ratingValue: Number(r.rating),
            bestRating: 5,
            worstRating: 1,
          },
          author: { '@type': 'Person', name: r.author },
          ...(r.title?.trim() ? { name: r.title.trim() } : {}),
          reviewBody: r.body.trim(),
          ...(r.datePublished ? { datePublished: r.datePublished } : {}),
        })),
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

export function buildProductQAPageJsonLd(args: {
  productId: string | number
  productName: string
  productUrl: string
  questions: Array<{
    question: string
    answer: string
    askedAt?: string
    answeredAt?: string
    askedBy?: string
    answeredBy?: string
  }>
}): Record<string, unknown> | null {
  const { productUrl, questions } = args

  if (!Array.isArray(questions) || questions.length === 0) return null

  const mainEntity = questions
    .map((q) => ({
      '@type': 'Question',
      name: q.question,
      text: q.question,
      dateCreated: q.askedAt,
      author: q.askedBy ? { '@type': 'Person', name: q.askedBy } : undefined,
      answerCount: q.answer ? 1 : 0,
      acceptedAnswer:
        q.answer ?
          {
            '@type': 'Answer',
            text: q.answer,
            dateCreated: q.answeredAt,
            author: q.answeredBy ? { '@type': 'Person', name: q.answeredBy } : undefined,
          }
        : undefined,
    }))
    .filter((q) => q.answerCount > 0)

  if (mainEntity.length === 0) return null

  // Strip undefined keys to match existing JSON-LD style.
  return JSON.parse(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      '@id': `${productUrl}#qapage`,
      mainEntity,
    }),
  ) as Record<string, unknown>
}

import type { Category, Product } from '@/payload-types'

import { getGeoSiteContext } from '@/lib/seo/geoContent/siteContext'
import type { ProductGeoContent } from '@/lib/seo/geoContent/types'

type ProductInput = Pick<Product, 'title' | 'slug' | 'meta' | 'priceInBDT'> & {
  categories?: (Category | number | null)[] | null
}

function detectProductKind(title: string, slug: string) {
  const t = `${title} ${slug}`.toLowerCase()
  if (/\bhat\b/.test(t)) return 'hat' as const
  if (/t-?shirt|tee\b/.test(t)) return 'tshirt' as const
  if (/night|pajama|pyjama|loungewear|sleepwear|nightdress|night dress/.test(t)) {
    return 'nightwear' as const
  }
  return 'apparel' as const
}

function categoryNames(categories: ProductInput['categories']): string[] {
  if (!categories?.length) return []
  return categories
    .filter(
      (c): c is Category =>
        c != null && typeof c === 'object' && typeof c.title === 'string',
    )
    .map((c) => c.title)
}

function formatPriceBdt(price: number | null | undefined, currency: string) {
  if (typeof price !== 'number') return null
  return `${currency} ${price.toLocaleString('en-BD')}`
}

export function generateProductGeo(product: ProductInput): ProductGeoContent {
  const ctx = getGeoSiteContext()
  const kind = detectProductKind(product.title, product.slug || '')
  const cats = categoryNames(product.categories)
  const categoryPhrase = cats.length ? cats.join(', ') : 'our catalog'
  const metaDesc = product.meta?.description?.trim()
  const priceLine = formatPriceBdt(product.priceInBDT, ctx.currency)

  const sharedShipping = `${ctx.deliveryNote} ${ctx.returnsNote}`

  if (kind === 'hat') {
    return {
      aiSummary:
        metaDesc ||
        `${product.title} is a breathable, adjustable hat sold by ${ctx.siteName} with delivery across ${ctx.country}. Ideal for everyday wear and outdoor use.${priceLine ? ` Price from ${priceLine}.` : ''}`,
      keyFeatures: [
        { feature: 'Breathable fabric for all-day comfort' },
        { feature: 'Adjustable strap for a secure fit' },
        { feature: 'Lightweight design for travel and outdoor wear' },
        { feature: 'Multiple color options where variants are available' },
        { feature: `Sold online in ${ctx.country} with checkout in ${ctx.currency}` },
      ],
      whyChooseThis: `${product.title} balances sun protection and comfort without bulk. Shoppers choose it when they want a reliable hat that pairs with casual and outdoor outfits from ${categoryPhrase}.`,
      usageInfo:
        'Wear for commuting, travel, sports, or sunny days. Spot-clean when needed; follow the care label on your variant. Choose your size/color variant before adding to cart if the product has options.',
      shippingReturnsNote: sharedShipping,
      faqs: [
        {
          question: `Does ${product.title} ship across ${ctx.country}?`,
          answer: `Yes. ${ctx.siteName} delivers nationwide. Shipping fees and estimated delivery windows are shown at checkout based on your district.`,
        },
        {
          question: 'How do I pick the right size or color?',
          answer:
            'Open the product page and select available variants (such as color) before checkout. Stock availability updates in real time when variants are enabled.',
        },
        {
          question: 'Can I return this hat if it does not fit?',
          answer:
            'Unworn items in original packaging can be returned within 7 days unless your order qualifies for an exchange. Hygiene-sensitive items may have restrictions—see our returns policy at checkout.',
        },
        {
          question: priceLine ? `What is the price of ${product.title}?` : `How is ${product.title} priced?`,
          answer:
            priceLine ?
              `The listed price is ${priceLine}. Final amount may vary if you select variants or if promotions apply at checkout.`
            : 'Pricing is shown on the product page in BDT. Select variants to see the exact price before payment.',
        },
      ],
    }
  }

  if (kind === 'tshirt') {
    return {
      aiSummary:
        metaDesc ||
        `${product.title} is a cotton-blend unisex tee from ${ctx.siteName}, available online in ${ctx.country} with size and color variants.${priceLine ? ` From ${priceLine}.` : ''} Suitable for everyday wear and layering.`,
      keyFeatures: [
        { feature: 'Soft cotton blend for everyday comfort' },
        { feature: 'Unisex fit with multiple sizes (S–XL where listed)' },
        { feature: 'Color and size variants on select listings' },
        { feature: 'Machine-washable; follow garment care label' },
        { feature: `Checkout in ${ctx.currency} with delivery across ${ctx.country}` },
      ],
      whyChooseThis: `This tee is a wardrobe staple: easy to style, comfortable for warm weather, and available in sizes that suit most builds. It is listed under ${categoryPhrase} for shoppers comparing basics and gifts.`,
      usageInfo:
        'Machine wash cold with similar colors. Tumble dry low or line dry. Size up if you prefer a relaxed fit. Check the variant selector for in-stock sizes and colors.',
      shippingReturnsNote: sharedShipping,
      faqs: [
        {
          question: 'What sizes are available?',
          answer:
            'Available sizes appear on the product page when variants are enabled. If a size is out of stock, try another color or check back after restock.',
        },
        {
          question: 'Is this T-shirt true to size?',
          answer:
            'It is designed as a standard unisex fit. If you are between sizes or prefer a looser fit, consider sizing up.',
        },
        {
          question: `Do you deliver ${product.title} outside Dhaka?`,
          answer: `Yes. ${ctx.siteName} ships to districts across ${ctx.country}. Delivery estimates are shown at checkout.`,
        },
        {
          question: 'How do I care for printed or dyed fabrics?',
          answer:
            'Wash inside-out in cold water and avoid high heat on prints. Always follow the care label included with your item.',
        },
      ],
    }
  }

  if (kind === 'nightwear') {
    return {
      aiSummary:
        metaDesc ||
        `${product.title} is comfortable nightwear from ${ctx.siteName}, sold online in ${ctx.country} with discreet packaging and nationwide delivery.${priceLine ? ` From ${priceLine}.` : ''}`,
      keyFeatures: [
        { feature: 'Soft fabrics chosen for sleep and lounging' },
        { feature: 'Breathable materials suited to tropical nights' },
        { feature: 'Easy-care washing instructions on the label' },
        { feature: 'Multiple sizes where variants are listed' },
        { feature: `Secure checkout in ${ctx.currency}` },
      ],
      whyChooseThis: `Shoppers pick ${product.title} for reliable comfort at home—lightweight feel, modest coverage, and styles that suit Bangladesh’s climate. Browse related items in ${categoryPhrase} for sets and seasonal picks.`,
      usageInfo:
        'Wear for sleep or relaxed time at home. Wash before first use. Choose size based on your usual garment size; refer to measurements on the product page when provided.',
      shippingReturnsNote: sharedShipping,
      faqs: [
        {
          question: 'Is nightwear packaging discreet?',
          answer:
            'Orders are packed in standard e-commerce packaging without explicit product labeling on the outside.',
        },
        {
          question: 'Which size should I order?',
          answer:
            'Use your regular clothing size unless a size chart is shown. If between sizes, size up for a looser sleep fit.',
        },
        {
          question: `How fast is delivery in ${ctx.country}?`,
          answer: ctx.deliveryNote,
        },
        {
          question: 'Can I exchange a nightwear item?',
          answer:
            'Unopened items in original packaging may qualify for return or exchange within 7 days. Opened intimate apparel is excluded for hygiene unless defective.',
        },
      ],
    }
  }

  return {
    aiSummary:
      metaDesc ||
      `${product.title} is available from ${ctx.siteName} online in ${ctx.country}.${priceLine ? ` Price from ${priceLine}.` : ''} See full details, variants, and stock on the product page.`,
    keyFeatures: [
      { feature: `Sold by ${ctx.siteName} with online checkout` },
      { feature: `Delivery available across ${ctx.country}` },
      { feature: 'Product details and images on this page' },
      ...(cats.length ? [{ feature: `Browse more in ${cats[0]}` }] : []),
    ],
    whyChooseThis: `${product.title} is part of ${categoryPhrase} at ${ctx.siteName}. Compare features, price, and availability here before you buy.`,
    usageInfo: 'Follow any care instructions on the product label or description. Select variants before adding to cart when options are shown.',
    shippingReturnsNote: sharedShipping,
    faqs: [
      {
        question: `Where can I buy ${product.title} in ${ctx.country}?`,
        answer: `You can order directly from ${ctx.siteName} on this product page with delivery across ${ctx.country}.`,
      },
      {
        question: 'Are variants supported?',
        answer:
          'If size or color options appear on this page, choose them before checkout. Stock reflects the selected variant.',
      },
      {
        question: 'What is your return policy?',
        answer: ctx.returnsNote,
      },
    ],
  }
}

import { getGeoSiteContext } from '@/lib/seo/geoContent/siteContext'
import type { PostGeoContent } from '@/lib/seo/geoContent/types'

type PostInput = {
  title: string
  slug?: string | null
  contentType?: string | null
  excerpt?: string | null
  metaDescription?: string | null
}

function detectPostTopic(title: string) {
  const t = title.toLowerCase()
  if (/masala|spice|ghorer bazar/.test(t)) return 'masala' as const
  if (/night|pajama|sleepwear/.test(t)) return 'nightwear' as const
  if (/buying guide|how to choose/.test(t)) return 'buying-guide' as const
  return 'general' as const
}

export function generatePostGeo(post: PostInput): PostGeoContent {
  const ctx = getGeoSiteContext()
  const topic = detectPostTopic(post.title)
  const type = post.contentType || 'article'
  const excerpt = post.excerpt?.trim() || post.metaDescription?.trim()

  if (topic === 'masala') {
    return {
      aiSummary:
        excerpt ||
        `Product guide for Ghorer Bazar Shahi Masala: ingredients, usage, storage, and what to check before buying spices online in ${ctx.country}.`,
      keyTakeaways: [
        { point: 'Verify pack size, MRP, and expiry before purchase' },
        { point: 'Store masala in a cool, dry place away from moisture' },
        { point: 'Use measured amounts—Shahi blends are concentrated' },
        { point: 'Check allergen and ingredient lists if you have dietary restrictions' },
        { point: `Buy from trusted sellers like ${ctx.siteName} with clear product photos` },
      ],
      faqs: [
        {
          question: 'What is Ghorer Bazar Shahi Masala used for?',
          answer:
            'It is a blended spice mix commonly used for meat curries, biryanis, and festive cooking. Follow recipe quantities to balance heat and aroma.',
        },
        {
          question: 'How should I store opened masala?',
          answer:
            'Transfer to an airtight container, keep away from heat and humidity, and use within the manufacturer’s recommended period after opening.',
        },
        {
          question: 'How do I spot authentic packaging?',
          answer:
            'Look for sealed packs, readable expiry dates, batch codes, and consistent branding. Compare weight and barcode with listing photos.',
        },
      ],
    }
  }

  if (type === 'buying-guide' || topic === 'buying-guide') {
    return {
      aiSummary:
        excerpt ||
        `Buying guide: how to choose the right products online at ${ctx.siteName} in ${ctx.country}—fit, fabric, price, and delivery tips.`,
      keyTakeaways: [
        { point: 'Start with your size and fabric preference' },
        { point: 'Compare BDT prices and in-stock variants' },
        { point: 'Read product FAQs and AI summaries on each PDP' },
        { point: 'Confirm district delivery windows at checkout' },
        { point: 'Review return rules before ordering intimate apparel' },
      ],
      faqs: [
        {
          question: 'How do I compare products quickly?',
          answer:
            'Use category pages and open each product’s summary, features, and FAQ blocks. Add finalists to cart only after checking variants.',
        },
        {
          question: 'When is the best time to order?',
          answer:
            'Order when your size and color variant show in stock. Peak seasons may have slightly longer delivery—check checkout estimates.',
        },
      ],
    }
  }

  if (type === 'how-to') {
    return {
      aiSummary:
        excerpt ||
        `Step-by-step how-to from ${ctx.siteName}: practical instructions you can follow when shopping or using products in ${ctx.country}.`,
      keyTakeaways: [
        { point: 'Read the full guide before starting' },
        { point: 'Gather materials or product details listed in the article' },
        { point: 'Follow steps in order for predictable results' },
        { point: 'Contact support if a step references a missing product variant' },
      ],
      faqs: [
        {
          question: 'Can I print or share this guide?',
          answer: 'Yes—link to this article URL for sharing. Content is updated when products or policies change.',
        },
        {
          question: 'What if a product mentioned is out of stock?',
          answer: 'Browse the related category for substitutes or enable alerts when available on the product page.',
        },
      ],
    }
  }

  return {
    aiSummary:
      excerpt ||
      `${post.title} — article from ${ctx.siteName} covering product tips, shopping advice, and updates for readers in ${ctx.country}.`,
    keyTakeaways: [
      { point: 'Skim the summary first for the main answer' },
      { point: 'Use linked products for live price and stock' },
      { point: 'Check publish date for freshness' },
      { point: `Shop related items at ${ctx.siteName} with nationwide delivery` },
    ],
    faqs: [
      {
        question: 'Is this article kept up to date?',
        answer:
          'We update posts when product details or policies change. See the published and updated dates at the top of the article.',
      },
      {
        question: `Can I buy items mentioned in ${post.title}?`,
        answer: `Yes—use product links in the article or browse ${ctx.siteName} shop categories for current listings.`,
      },
    ],
  }
}

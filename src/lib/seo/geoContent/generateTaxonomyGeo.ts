import { getGeoSiteContext } from '@/lib/seo/geoContent/siteContext'
import type { TaxonomyGeoContent } from '@/lib/seo/geoContent/types'

type TaxonomyInput = {
  title: string
  slug?: string | null
  metaDescription?: string | null
  kind: 'category' | 'brand'
}

function detectCategoryKind(title: string, slug: string) {
  const t = `${title} ${slug}`.toLowerCase()
  if (/\bhat/.test(t)) return 'hats'
  if (/t-?shirt|tee/.test(t)) return 'tshirts'
  if (/accessor/.test(t)) return 'accessories'
  if (/night|pajama|sleep|lounge/.test(t)) return 'nightwear'
  if (/men|women|ladies|gents/.test(t)) return 'gender'
  return 'general'
}

export function generateTaxonomyGeo(input: TaxonomyInput): TaxonomyGeoContent {
  const ctx = getGeoSiteContext()
  const slug = input.slug || ''
  const kind = detectCategoryKind(input.title, slug)
  const label = input.kind === 'brand' ? 'brand' : 'category'

  if (input.kind === 'brand') {
    return {
      aiSummary:
        input.metaDescription?.trim() ||
        `Shop ${input.title} products at ${ctx.siteName}. Official ${input.title} collection with online ordering and delivery across ${ctx.country}.`,
      overview: `${input.title} is a ${label} featured at ${ctx.siteName}. This page lists published products, filters, and editorial notes to help you compare styles, prices, and availability in ${ctx.currency}.`,
      buyingGuide: `When shopping ${input.title}, check fabric composition, size availability, and customer ratings on each product card. Add items to cart individually or compare similar SKUs before checkout. Sign in to track orders and save addresses for faster repeat purchases.`,
      faqs: [
        {
          question: `Is ${input.title} an official brand on ${ctx.siteName}?`,
          answer: `This page lists ${input.title} products curated for our catalog. Product titles and descriptions are maintained by ${ctx.siteName} for accurate search and AI summaries.`,
        },
        {
          question: `Does ${input.title} ship nationwide?`,
          answer: ctx.deliveryNote,
        },
        {
          question: 'How do I find the best-selling items?',
          answer:
            'Use shop sorting and filters on this brand page. Open a product to read AI summaries, features, and FAQs before you buy.',
        },
      ],
    }
  }

  if (kind === 'hats') {
    return {
      aiSummary:
        input.metaDescription?.trim() ||
        `Browse hats and headwear at ${ctx.siteName}. Sun-ready caps and casual styles with delivery across ${ctx.country}.`,
      overview: `The ${input.title} ${label} includes hats and headwear for daily wear, travel, and outdoor use. Products highlight fit, material, and color options where variants exist.`,
      buyingGuide:
        'Choose hats with adjustable straps for flexible fit. Prefer breathable cotton or mesh for hot weather. Check variant stock for your preferred color. Compare prices in BDT before checkout.',
      faqs: [
        {
          question: 'What hat styles do you stock?',
          answer:
            'Listings may include caps and casual hats with adjustable straps. Open each product for materials, colors, and live stock.',
        },
        {
          question: 'How do I pick the right hat size?',
          answer:
            'Most hats use adjustable straps. Read the product description for circumference notes when provided.',
        },
        {
          question: `Do hats ship outside Dhaka?`,
          answer: `Yes—${ctx.siteName} delivers hats and accessories nationwide across ${ctx.country}.`,
        },
      ],
    }
  }

  if (kind === 'tshirts') {
    return {
      aiSummary:
        input.metaDescription?.trim() ||
        `Shop T-shirts and tees at ${ctx.siteName} in ${ctx.country}. Cotton basics and graphic styles with size and color variants.`,
      overview: `${input.title} covers everyday tees and unisex tops. Use this page to filter by price, brand, and availability before adding to cart.`,
      buyingGuide:
        'Pick size based on your usual fit—size up for a relaxed look. Compare fabric content (cotton vs blend) and care instructions. Select color variants on the product page when available.',
      faqs: [
        {
          question: 'Are T-shirts true to size?',
          answer:
            'Most tees run standard unisex. Check each product’s GEO section for fit notes and variant sizes.',
        },
        {
          question: 'Can I machine wash these tees?',
          answer: 'Yes—wash cold with similar colors unless the care label states otherwise.',
        },
        {
          question: 'Do you offer plus sizes?',
          answer: 'Available sizes are shown per product. Look for XL or larger variants on the listing.',
        },
      ],
    }
  }

  if (kind === 'accessories') {
    return {
      aiSummary:
        input.metaDescription?.trim() ||
        `Discover accessories at ${ctx.siteName}—hats, add-ons, and complementary items with ${ctx.country} delivery.`,
      overview: `${input.title} groups complementary items that complete your outfit or order. Browse in-stock products and open each listing for features and FAQs.`,
      buyingGuide:
        'Match accessories to your main purchase (size, color palette, season). Check bundle or combo deals on the homepage when available.',
      faqs: [
        {
          question: 'What is included in Accessories?',
          answer:
            'This category may list hats, small apparel add-ons, and related items. Each product page describes materials and use cases.',
        },
        {
          question: 'Can I return accessories?',
          answer: ctx.returnsNote,
        },
        {
          question: 'Are accessories stocked separately?',
          answer: 'Yes—inventory is tracked per SKU. Variant selectors show real-time availability.',
        },
      ],
    }
  }

  if (kind === 'nightwear') {
    return {
      aiSummary:
        input.metaDescription?.trim() ||
        `Shop nightwear and sleepwear online in ${ctx.country} at ${ctx.siteName}. Comfortable fabrics for tropical nights with nationwide delivery.`,
      overview: `${input.title} features pajamas, night dresses, and loungewear chosen for comfort in Bangladesh’s climate. Compare fabrics, sizes, and prices in one place.`,
      buyingGuide:
        'Prioritize breathable cotton or modal blends. For gifting, confirm size with our size notes. Read shipping and hygiene policies before ordering intimate apparel.',
      faqs: [
        {
          question: 'What nightwear fabrics work best in Bangladesh?',
          answer: 'Light cotton and breathable blends help in warm, humid weather. Avoid heavy fleece unless air-conditioned use.',
        },
        {
          question: 'How should I choose a size?',
          answer: 'Use your regular garment size; size up for a looser sleep fit when between sizes.',
        },
        {
          question: 'Is packaging discreet?',
          answer: 'Yes—orders ship in standard e-commerce packaging.',
        },
      ],
    }
  }

  return {
    aiSummary:
      input.metaDescription?.trim() ||
      `Browse ${input.title} at ${ctx.siteName}. Shop online in ${ctx.country} with ${ctx.currency} pricing and nationwide delivery.`,
    overview: `The ${input.title} ${label} page helps shoppers discover products, compare prices, and read AI-friendly summaries before purchase.`,
    buyingGuide: `Filter by price and availability, open product pages for detailed features and FAQs, then checkout securely with ${ctx.siteName}.`,
    faqs: [
      {
        question: `How do I shop the ${input.title} ${label}?`,
        answer: `Browse listings on this page, open a product for details, select variants if shown, and add to cart. Delivery options appear at checkout.`,
      },
      {
        question: `Does ${ctx.siteName} deliver across ${ctx.country}?`,
        answer: ctx.deliveryNote,
      },
      {
        question: 'Where can I read return rules?',
        answer: ctx.returnsNote,
      },
    ],
  }
}

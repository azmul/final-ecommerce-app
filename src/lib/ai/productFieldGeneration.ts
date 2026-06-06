export type ProductFieldOutputType = 'array' | 'lexical' | 'string'

export type ProductGeneratableFieldKey =
  | 'description'
  | 'meta.description'
  | 'meta.title'
  | 'productBadge'
  | 'seoContent.aiSummary'
  | 'seoContent.faqs'
  | 'seoContent.keyFeatures'
  | 'seoContent.shippingReturnsNote'
  | 'seoContent.usageInfo'
  | 'seoContent.whyChooseThis'
  | 'sizeGuideNote'
  | 'technicalSpecs'

export type ProductFieldGenerationConfig = {
  instruction: string
  jsonSchema: string
  label: string
  outputType: ProductFieldOutputType
}

export const PRODUCT_GENERATABLE_FIELDS: Record<
  ProductGeneratableFieldKey,
  ProductFieldGenerationConfig
> = {
  description: {
    label: 'product description',
    outputType: 'lexical',
    instruction:
      'Write a compelling ecommerce product description (2–4 short paragraphs) for shoppers in Bangladesh. Highlight benefits, materials, fit, and use cases. Use plain text with paragraph breaks (blank lines). Do not invent specs not implied by the context.',
    jsonSchema: '{ "text": "multi-paragraph plain text" }',
  },
  'seoContent.aiSummary': {
    label: 'AI summary',
    outputType: 'string',
    instruction:
      'Write a concise factual summary (2–4 sentences) for meta descriptions and AI citations. Mention category, material, and use case when relevant.',
    jsonSchema: '{ "text": "string" }',
  },
  'seoContent.keyFeatures': {
    label: 'key features',
    outputType: 'array',
    instruction: 'List 4–6 short, factual product features as bullet points.',
    jsonSchema: '{ "items": [{ "feature": "string" }] }',
  },
  'seoContent.whyChooseThis': {
    label: 'why choose this product',
    outputType: 'string',
    instruction: 'Write a short paragraph explaining why a shopper should choose this product.',
    jsonSchema: '{ "text": "string" }',
  },
  'seoContent.usageInfo': {
    label: 'usage and care',
    outputType: 'string',
    instruction: 'Describe when to use/wear the product and basic care or sizing notes.',
    jsonSchema: '{ "text": "string" }',
  },
  'seoContent.shippingReturnsNote': {
    label: 'shipping and returns',
    outputType: 'string',
    instruction:
      'Write a brief note about delivery in Bangladesh and a generic return/exchange policy suitable for an online store. Do not promise specific timelines unless provided in context.',
    jsonSchema: '{ "text": "string" }',
  },
  'seoContent.faqs': {
    label: 'FAQs',
    outputType: 'array',
    instruction: 'Create 3–5 practical FAQs shoppers might ask about this product.',
    jsonSchema: '{ "items": [{ "question": "string", "answer": "string" }] }',
  },
  sizeGuideNote: {
    label: 'size guide note',
    outputType: 'string',
    instruction: 'Write a brief fit or sizing note for apparel/home products when applicable.',
    jsonSchema: '{ "text": "string" }',
  },
  productBadge: {
    label: 'product badge',
    outputType: 'string',
    instruction:
      'Suggest a short badge label for product cards (e.g. "Best Seller", "New Arrival"). Max 3 words.',
    jsonSchema: '{ "text": "string" }',
  },
  technicalSpecs: {
    label: 'technical specs',
    outputType: 'array',
    instruction:
      'List 4–8 technical specification rows (label + value) such as Material, Weight, Dimensions, Care. Only include specs you can infer from context.',
    jsonSchema: '{ "items": [{ "label": "string", "value": "string" }] }',
  },
  'meta.title': {
    label: 'SEO title',
    outputType: 'string',
    instruction: 'Write an SEO page title under 60 characters including the product name.',
    jsonSchema: '{ "text": "string" }',
  },
  'meta.description': {
    label: 'SEO meta description',
    outputType: 'string',
    instruction: 'Write an SEO meta description under 155 characters for Bangladesh shoppers.',
    jsonSchema: '{ "text": "string" }',
  },
}

export function isProductGeneratableFieldKey(value: string): value is ProductGeneratableFieldKey {
  return value in PRODUCT_GENERATABLE_FIELDS
}

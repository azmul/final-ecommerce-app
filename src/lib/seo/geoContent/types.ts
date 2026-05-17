export type ProductGeoContent = {
  aiSummary: string
  keyFeatures: { feature: string }[]
  whyChooseThis: string
  usageInfo: string
  shippingReturnsNote: string
  faqs: { question: string; answer: string }[]
}

export type TaxonomyGeoContent = {
  aiSummary: string
  overview: string
  buyingGuide: string
  faqs: { question: string; answer: string }[]
}

export type PostGeoContent = {
  aiSummary: string
  keyTakeaways: { point: string }[]
  faqs: { question: string; answer: string }[]
}

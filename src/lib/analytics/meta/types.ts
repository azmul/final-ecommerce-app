export const META_STANDARD_EVENTS = [
  'PageView',
  'ViewContent',
  'Search',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration',
] as const

export type MetaStandardEvent = (typeof META_STANDARD_EVENTS)[number]

export type MetaContentItem = {
  id: string
  quantity?: number
  item_price?: number
  title?: string
  category?: string
}

export type MetaCustomData = {
  content_ids?: string[]
  content_name?: string
  content_category?: string
  content_type?: 'product' | 'product_group'
  contents?: MetaContentItem[]
  currency?: string
  value?: number
  search_string?: string
  order_id?: string
  num_items?: number
}

export type MetaCapiUserDataInput = {
  email?: string | null
  phone?: string | null
  clientIp?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  externalId?: string | null
}

export type MetaCapiEventInput = {
  eventName: MetaStandardEvent | string
  eventId: string
  eventTimeSeconds?: number
  eventSourceUrl?: string
  customData?: MetaCustomData
  userData?: MetaCapiUserDataInput
}

export type MetaClientTrackInput = {
  eventName: MetaStandardEvent | string
  eventId: string
  customData?: MetaCustomData
}

export type StoreAnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'purchase'
  | 'search'
  | 'lead'
  | 'complete_registration'

export const STORE_EVENT_TO_META: Record<StoreAnalyticsEventType, MetaStandardEvent> = {
  page_view: 'PageView',
  product_view: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
  search: 'Search',
  lead: 'Lead',
  complete_registration: 'CompleteRegistration',
}

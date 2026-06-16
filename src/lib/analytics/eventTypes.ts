import type { AnalyticsEventType } from '@/lib/analytics/logAnalyticsEvent'

export type { AnalyticsEventType }

export const ANALYTICS_EVENT_TYPES = new Set<AnalyticsEventType>([
  'product_view',
  'add_to_cart',
  'begin_checkout',
  'add_payment_info',
  'purchase',
  'search',
  'lead',
  'complete_registration',
])

import { randomUUID } from '@/utilities/randomUUID'

import type { StoreAnalyticsEventType } from '@/lib/analytics/meta/types'

export function createMetaEventId(prefix = 'evt'): string {
  return `${prefix}_${randomUUID()}`
}

export function createPurchaseEventId(orderId: string | number): string {
  return `purchase_${orderId}`
}

export function createPageViewEventId(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return `pageview_${normalized}_${Date.now()}`
}

export function createStoreEventId(
  eventType: StoreAnalyticsEventType,
  subject?: string | number,
): string {
  if (eventType === 'purchase' && subject != null) {
    return createPurchaseEventId(subject)
  }

  const subjectPart = subject != null ? `_${subject}` : ''
  return `${eventType}${subjectPart}_${randomUUID()}`
}

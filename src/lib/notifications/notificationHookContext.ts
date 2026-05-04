/** Set in product `beforeChange` so `afterChange` can compare against DB state even when `previousDoc` omits price fields. */
export const CONTEXT_NOTIFICATION_PREV_PRODUCT = 'notificationPrevProduct' as const

/** Set in variant `beforeChange` for the same reason. */
export const CONTEXT_NOTIFICATION_PREV_VARIANT = 'notificationPrevVariant' as const

export type NotificationPrevProductSnapshot = {
  enableVariants?: unknown
  inventory?: unknown
  priceInBDT?: unknown
}

export type NotificationPrevVariantSnapshot = {
  inventory?: unknown
  priceInBDT?: unknown
}

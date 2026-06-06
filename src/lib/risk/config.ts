/** Order amount threshold in minor currency units (5000 BDT = 500000 poisha). */
export const HIGH_COD_AMOUNT_MINOR = 500_000

export const PHONE_VELOCITY_WINDOW_MS = 24 * 60 * 60 * 1000
export const PHONE_VELOCITY_THRESHOLD = 3

export const ADDRESS_CLUSTER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
export const ADDRESS_CLUSTER_PHONE_THRESHOLD = 3

export const REGISTRATION_BURST_WINDOW_MS = 60 * 60 * 1000
export const REGISTRATION_BURST_THRESHOLD = 3

export const REFERRAL_CLUSTER_WINDOW_MS = 60 * 60 * 1000
export const REFERRAL_CLUSTER_THRESHOLD = 3

export const NEW_ACCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000
export const REFERRAL_ORDER_WINDOW_MS = 60 * 60 * 1000

export const RISK_LEVEL_THRESHOLDS = {
  medium: 25,
  high: 50,
} as const

export const RISK_FLAG_WEIGHTS = {
  guestCodCheckout: 15,
  highCodAmount: 20,
  phoneVelocity: 25,
  priorCancelledOrders: 30,
  processingWithoutDelivery: 20,
  duplicateAddressCluster: 25,
  promoFirstGuestOrder: 15,
  loyaltyNewAccount: 15,
  referralQuickOrder: 20,
  weakAddress: 10,
  sharedHighRiskIp: 15,
  registrationBurst: 30,
  disposableEmail: 25,
  suspiciousName: 10,
  phoneCollision: 40,
  referralCluster: 20,
  syntheticEmailOnly: 5,
} as const

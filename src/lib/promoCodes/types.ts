export type CartLineForPromo = {
  productId: number
  lineSubtotal: number
  categoryIds: number[]
}

export type PromoValidationError =
  | 'invalid_code'
  | 'inactive'
  | 'expired'
  | 'not_started'
  | 'usage_limit'
  | 'per_user_limit'
  | 'first_time_only'
  | 'email_domain'
  | 'min_order'
  | 'no_eligible_items'

export const promoErrorMessages: Record<PromoValidationError, string> = {
  invalid_code: 'That code is not valid.',
  inactive: 'This promotion is no longer available.',
  expired: 'This promotion has expired.',
  not_started: 'This promotion is not active yet.',
  usage_limit: 'This promotion has reached its usage limit.',
  per_user_limit: 'You have already used this code the maximum number of times.',
  first_time_only: 'This promotion is only for first-time customers.',
  email_domain: 'Your account is not eligible for this promotion.',
  min_order: 'Your order does not meet the minimum amount for this code.',
  no_eligible_items: 'This code does not apply to the items in your cart.',
}

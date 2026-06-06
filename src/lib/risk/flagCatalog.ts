const FLAG_LABELS: Record<string, string> = {
  guest_cod_checkout: 'Guest cash-on-delivery checkout',
  high_cod_amount: 'High COD order amount',
  phone_velocity: 'Multiple orders from same phone recently',
  prior_cancelled_orders: 'Prior cancelled or refunded orders for this phone',
  processing_without_delivery: 'Processing orders but no successful deliveries',
  duplicate_address_cluster: 'Address shared by multiple phones recently',
  promo_first_guest_order: 'Promo applied on first guest order',
  loyalty_new_account: 'Loyalty or gift card on brand-new account',
  referral_quick_order: 'Order shortly after referral signup',
  weak_address: 'Suspicious or incomplete delivery address',
  shared_high_risk_ip: 'Same IP as other high-risk orders recently',
  registration_burst: 'Multiple registrations from same IP recently',
  disposable_email: 'Disposable email domain',
  suspicious_name: 'Suspicious account name',
  phone_collision: 'Phone already linked to another account',
  referral_cluster: 'Referral burst from same referrer',
  synthetic_email_only: 'Phone-only synthetic login email',
}

export function getRiskFlagLabel(flag: string): string {
  return FLAG_LABELS[flag] ?? flag
}

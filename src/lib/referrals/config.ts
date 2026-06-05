export const REFERRAL_REWARD_POINTS = Number(process.env.REFERRAL_REWARD_POINTS ?? '200')

export function generateReferralCode(seed: string | number): string {
  const base = String(seed).replace(/\D/g, '').slice(-6).padStart(6, '0')
  return `REF${base}`
}

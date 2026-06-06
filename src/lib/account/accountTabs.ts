export const ACCOUNT_TAB_IDS = [
  'profile',
  'orders',
  'addresses',
  'notifications',
  'rewards',
] as const

export type AccountTabId = (typeof ACCOUNT_TAB_IDS)[number]

export function isAccountTabId(value: string | null | undefined): value is AccountTabId {
  return ACCOUNT_TAB_IDS.includes(value as AccountTabId)
}

export function accountTabHref(tab: AccountTabId): string {
  if (tab === 'profile') return '/account'
  return `/account?tab=${tab}`
}

export function resolveAccountTabId(value: string | null | undefined): AccountTabId {
  return isAccountTabId(value) ? value : 'profile'
}

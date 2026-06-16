import { PWA_ICON_PATHS } from '@/lib/pwa/config'
import { getServerSideURL } from '@/utilities/getURL'

export type SiteSeoConfig = {
  name: string
  companyName: string
  description: string
  url: string
  locale: string
  currency: string
  country: string
  logoUrl: string
  contactEmail?: string
  contactPhone?: string
  socialProfiles: string[]
}

function parseList(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Central SEO / AISO site identity from environment variables. */
export function getSiteSeoConfig(): SiteSeoConfig {
  const url = getServerSideURL()
  const name = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const companyName = process.env.COMPANY_NAME || name

  return {
    name,
    companyName,
    description:
      process.env.SITE_DESCRIPTION?.trim() ||
      'Shop quality nightwear and apparel online in Bangladesh with fast checkout and nationwide delivery.',
    url,
    locale: process.env.SITE_LOCALE || 'en-BD',
    currency: process.env.SITE_CURRENCY || 'BDT',
    country: process.env.SITE_COUNTRY || 'BD',
    logoUrl: `${url}${PWA_ICON_PATHS.any512}`,
    contactEmail: process.env.CONTACT_EMAIL?.trim() || undefined,
    contactPhone:
      process.env.CONTACT_PHONE?.trim() ||
      process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() ||
      undefined,
    socialProfiles: parseList(process.env.SOCIAL_PROFILE_URLS),
  }
}

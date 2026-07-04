import { PWA_ICON_PATHS } from '@/lib/pwa/config'
import { getServerSideURL } from '@/utilities/getURL'

export type PostalAddress = {
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: string
}

export type GeoCoordinates = {
  latitude: string | undefined
  longitude: string | undefined
}

export type ContactPoint = {
  telephone: string
  email: string
  areaServed: string
  availableLanguage: string[]
}

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
  postalAddress: PostalAddress
  geo: GeoCoordinates
  contactPoint: ContactPoint
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

  const socialProfiles = [
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN,
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE,
    process.env.NEXT_PUBLIC_SOCIAL_TIKTOK,
    process.env.NEXT_PUBLIC_SOCIAL_X,
    process.env.NEXT_PUBLIC_SOCIAL_THREADS,
  ]
    .flatMap((v) => (v ? [v.trim()] : []))
    .filter(Boolean)

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
    socialProfiles:
      socialProfiles.length > 0 ? socialProfiles : parseList(process.env.SOCIAL_PROFILE_URLS),
    postalAddress: {
      streetAddress: process.env.NEXT_PUBLIC_BIZ_STREET ?? '',
      addressLocality: process.env.NEXT_PUBLIC_BIZ_CITY ?? 'Dhaka',
      addressRegion: process.env.NEXT_PUBLIC_BIZ_REGION ?? 'Dhaka',
      postalCode: process.env.NEXT_PUBLIC_BIZ_POSTAL ?? '',
      addressCountry: process.env.NEXT_PUBLIC_BIZ_COUNTRY ?? 'BD',
    },
    geo: {
      latitude: process.env.NEXT_PUBLIC_BIZ_LAT ?? undefined,
      longitude: process.env.NEXT_PUBLIC_BIZ_LON ?? undefined,
    },
    contactPoint: {
      telephone: process.env.NEXT_PUBLIC_BIZ_PHONE ?? '',
      email: process.env.NEXT_PUBLIC_BIZ_EMAIL ?? '',
      areaServed: 'BD',
      availableLanguage: ['English', 'Bengali'],
    },
  }
}

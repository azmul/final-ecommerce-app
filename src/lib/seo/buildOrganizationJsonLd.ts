import type { SiteSeoConfig } from '@/lib/seo/siteConfig'

export function buildOrganizationJsonLd(site: SiteSeoConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${site.url}/#organization`,
    name: site.companyName,
    url: site.url,
    logo: site.logoUrl,
    description: site.description,
    ...(site.contactEmail || site.contactPhone ?
      {
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          ...(site.contactEmail ? { email: site.contactEmail } : {}),
          ...(site.contactPhone ? { telephone: site.contactPhone } : {}),
          areaServed: site.country,
          availableLanguage: ['en', 'bn'],
        },
      }
    : {}),
    ...(site.socialProfiles.length > 0 ? { sameAs: site.socialProfiles } : {}),
  }
}

export function buildWebSiteJsonLd(site: SiteSeoConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { '@id': `${site.url}/#organization` },
    inLanguage: site.locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site.url}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

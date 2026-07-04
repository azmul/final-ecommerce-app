import type { SiteSeoConfig } from '@/lib/seo/siteConfig'

function hasAddress(site: SiteSeoConfig): boolean {
  const a = site.postalAddress
  return Boolean(
    a.streetAddress || a.addressLocality || a.addressRegion || a.postalCode || a.addressCountry,
  )
}

function hasContactPoint(site: SiteSeoConfig): boolean {
  return Boolean(site.contactPoint.telephone || site.contactPoint.email)
}

function hasGeo(site: SiteSeoConfig): boolean {
  return Boolean(site.geo.latitude && site.geo.longitude)
}

function buildAddressNode(site: SiteSeoConfig) {
  return {
    '@type': 'PostalAddress',
    ...site.postalAddress,
  }
}

function buildContactPointNode(site: SiteSeoConfig) {
  const { telephone, email, areaServed, availableLanguage } = site.contactPoint
  return {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    ...(telephone ? { telephone } : {}),
    ...(email ? { email } : {}),
    areaServed,
    availableLanguage,
  }
}

function buildGeoNode(site: SiteSeoConfig) {
  return {
    '@type': 'GeoCoordinates',
    latitude: site.geo.latitude,
    longitude: site.geo.longitude,
  }
}

export function buildOrganizationJsonLd(site: SiteSeoConfig) {
  const sameAs = site.socialProfiles.filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${site.url}/#organization`,
    name: site.companyName,
    url: site.url,
    logo: site.logoUrl,
    description: site.description,
    ...(hasContactPoint(site)
      ? { contactPoint: buildContactPointNode(site) }
      : site.contactEmail || site.contactPhone
        ? {
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
    ...(hasAddress(site) ? { address: buildAddressNode(site) } : {}),
    ...(hasGeo(site) ? { geo: buildGeoNode(site) } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
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
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${site.url}/shop?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
  }
}

export function buildLocalBusinessJsonLd(site: SiteSeoConfig) {
  const sameAs = site.socialProfiles.filter(Boolean)

  return {
    '@type': ['LocalBusiness', 'Store'],
    '@id': `${site.url}/#localbusiness`,
    name: site.companyName,
    url: site.url,
    image: site.logoUrl,
    description: site.description,
    ...(hasAddress(site) ? { address: buildAddressNode(site) } : {}),
    ...(hasGeo(site) ? { geo: buildGeoNode(site) } : {}),
    ...(hasContactPoint(site) ? { contactPoint: buildContactPointNode(site) } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

export function buildSiteJsonLdGraph(site: SiteSeoConfig) {
  const organizationId = `${site.url}/#organization`
  const websiteId = `${site.url}/#website`

  const organizationFull = buildOrganizationJsonLd(site)
  const websiteFull = buildWebSiteJsonLd(site)
  const { '@context': _orgCtx, ...organizationNode } = organizationFull
  const { '@context': _siteCtx, ...websiteNode } = websiteFull
  void _orgCtx
  void _siteCtx

  const graph: Record<string, unknown>[] = [
    { ...organizationNode, '@id': organizationId },
    { ...websiteNode, '@id': websiteId, publisher: { '@id': organizationId } },
  ]

  if (hasAddress(site)) {
    graph.push(buildLocalBusinessJsonLd(site))
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

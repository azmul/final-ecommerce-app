const EXCLUDED_ROUTE_PREFIXES = [
  '/_next',
  '/account',
  '/admin',
  '/api',
  '/cart',
  '/checkout',
  '/compare',
  '/create-account',
  '/find-order',
  '/forgot-password',
  '/login',
  '/logout',
  '/next',
  '/orders',
  '/wishlist',
]

const PUBLIC_ROUTE_PREFIXES = ['/all-brands', '/blog', '/brand', '/products', '/shop']

const STATIC_FILE_PATTERN = /\/[^/]+\.[^/]+$/

const startsWithRouteSegment = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

export const isCheckoutRoute = (pathname: string) =>
  startsWithRouteSegment(pathname, '/checkout')

export const isPublicFullReloadRoute = (pathname: string) => {
  if (!pathname.startsWith('/')) return false
  if (STATIC_FILE_PATTERN.test(pathname)) return false
  if (EXCLUDED_ROUTE_PREFIXES.some((prefix) => startsWithRouteSegment(pathname, prefix))) {
    return false
  }

  if (pathname === '/') return true
  if (PUBLIC_ROUTE_PREFIXES.some((prefix) => startsWithRouteSegment(pathname, prefix))) {
    return true
  }

  // CMS landing pages are mounted at /[slug]. Treat any non-reserved single
  // segment route as public so campaign/about/contact style pages get document loads.
  return pathname.split('/').filter(Boolean).length === 1
}

type ShouldForceFullPageNavigationArgs = {
  currentHref: string
  href: string
}

export const shouldForceFullPageNavigation = ({
  currentHref,
  href,
}: ShouldForceFullPageNavigationArgs) => {
  const currentURL = new URL(currentHref)
  const targetURL = new URL(href, currentURL)

  if (targetURL.origin !== currentURL.origin) return false
  if (isCheckoutRoute(currentURL.pathname) || isCheckoutRoute(targetURL.pathname)) return false

  const isSameDocument =
    targetURL.pathname === currentURL.pathname &&
    targetURL.search === currentURL.search &&
    targetURL.hash !== currentURL.hash

  if (isSameDocument) return false

  return (
    isPublicFullReloadRoute(currentURL.pathname) &&
    isPublicFullReloadRoute(targetURL.pathname)
  )
}

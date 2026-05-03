import { canUseDOM } from './canUseDOM'

export const getServerSideURL = () => {
  let url = process.env.NEXT_PUBLIC_SERVER_URL

  if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (!url) {
    url = 'http://localhost:3000'
  }

  return url.replace(/\/$/, '')
}

/** Turn a CMS-relative or absolute URL into a fully qualified URL for Open Graph / JSON-LD. */
export const toAbsoluteUrl = (path: string | null | undefined): string | undefined => {
  if (!path || typeof path !== 'string') return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = getServerSideURL()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}

/* eslint-disable no-undef */
const VERSION = 'v3'
const SHELL_CACHE = `pwa-shell-${VERSION}`
const PAGE_CACHE = `pwa-pages-${VERSION}`
const ASSET_CACHE = `pwa-assets-${VERSION}`
const ALL_CACHES = [SHELL_CACHE, PAGE_CACHE, ASSET_CACHE]

const OFFLINE_URL = '/offline'
const MAX_PAGE_ENTRIES = 30
const MAX_ASSET_ENTRIES = 100

const SHELL = [
  '/',
  OFFLINE_URL,
  '/favicon.svg',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !ALL_CACHES.includes(key)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

/** FIFO trim so runtime caches cannot grow without bound. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxEntries) return
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)))
}

async function putInCache(cacheName, request, response, maxEntries) {
  try {
    const cache = await caches.open(cacheName)
    await cache.put(request, response)
    await trimCache(cacheName, maxEntries)
  } catch {
    // Storage may be full or unavailable — serving from network still works.
  }
}

/** Network first; fall back to any cached copy, then the offline page. */
async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      void putInCache(PAGE_CACHE, request, response.clone(), MAX_PAGE_ENTRIES)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    const offline = await caches.match(OFFLINE_URL)
    return offline ?? Response.error()
  }
}

/** Cache first — hashed build assets never change under the same URL. */
async function handleImmutableAsset(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    void putInCache(ASSET_CACHE, request, response.clone(), MAX_ASSET_ENTRIES)
  }
  return response
}

/** Stale-while-revalidate for images and other same-origin static files. */
async function handleAsset(request) {
  const cached = await caches.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        void putInCache(ASSET_CACHE, request, response.clone(), MAX_ASSET_ENTRIES)
      }
      return response
    })
    .catch(() => cached ?? Response.error())

  return cached ?? network
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Never intercept APIs, the CMS admin, or media range requests (video seeks).
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/media/')) return
  if (url.pathname.startsWith('/admin')) return
  if (request.headers.has('range')) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleImmutableAsset(request))
    return
  }

  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/api/media/') ||
    url.pathname.startsWith('/_next/image')
  ) {
    event.respondWith(handleAsset(request))
  }
  // Everything else (RSC payloads, JSON, scripts outside _next/static) goes
  // straight to the network — no respondWith, browser handles it normally.
})

self.addEventListener('push', (event) => {
  let payload = { body: '', title: 'Notification', url: '/' }
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch {
    //
  }

  const title = payload.title || 'Notification'
  const body = payload.body || ''
  const url = typeof payload.url === 'string' && payload.url.length ? payload.url : '/'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: '/icons/icon-192.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url =
    event.notification.data && event.notification.data.url ? event.notification.data.url : '/'
  event.waitUntil(
    self.clients.openWindow ? self.clients.openWindow(url) : Promise.resolve(),
  )
})

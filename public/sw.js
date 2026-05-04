/* eslint-disable no-undef */
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
      icon: '/favicon.svg',
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

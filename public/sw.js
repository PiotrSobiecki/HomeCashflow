/* Service worker — Web Push dla HomeCashflow (klima ON/OFF). */

self.addEventListener('push', (event) => {
  let data = { title: 'HomeCashflow', body: '', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    data.body = event.data?.text?.() ?? data.body
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'HomeCashflow', {
      body: data.body || '',
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: data.tag || 'ac-power',
      renotify: true,
      data: { url: data.url || '/?view=urzadzenia' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/?view=urzadzenia'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})

// sw.js — Service Worker pour notifications push

self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  const title   = data.title   || 'Mémo — Rappel'
  const body    = data.body    || 'Vous avez une note à traiter.'
  const icon    = data.icon    || '/icon-192.png'
  const badge   = '/icon-72.png'
  const importance = data.importance || 1

  const colors = { 1: '#dc2626', 2: '#2563eb', 3: '#d97706', 4: '#6b7280' }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: data.noteId || 'memo-notif',
      data: { url: data.url || '/', noteId: data.noteId },
      actions: [
        { action: 'open', title: 'Voir la note' },
        { action: 'dismiss', title: 'Ignorer' },
      ],
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'dismiss') return
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

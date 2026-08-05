const CACHE_NAME = 'salud-conecta-cache-v11';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => (
        cacheName !== CACHE_NAME ? caches.delete(cacheName) : undefined
      ))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Salud-Conecta IA', body: 'Tienes una nueva notificacion' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/app-logo-v1.jpg',
    badge: '/app-logo-v1.jpg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      const url = event.notification.data.url;
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  // API data can be sensitive or user-specific. It must never enter Cache Storage.
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith('/api/')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', response.clone()));
          return response;
        })
        .catch(() => caches.match('/index.html').then((response) => response || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkRequest = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      });

      // Static assets return immediately on repeat visits and refresh in background.
      if (cachedResponse) {
        event.waitUntil(networkRequest.catch(() => undefined));
        return cachedResponse;
      }

      return networkRequest.catch(() => new Response('Contenido no disponible sin conexion a internet', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
      }));
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

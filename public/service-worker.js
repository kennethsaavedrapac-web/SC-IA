// Nombre de la caché para control de versiones
const CACHE_NAME = 'salud-conecta-cache-v10';

// Recursos esenciales que deben cachearse en la instalación para funcionamiento offline
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. EVENTO 'install': Se activa cuando el Service Worker se registra por primera vez.
// Aquí abrimos la caché y guardamos los archivos críticos definidos en ASSETS_TO_CACHE.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching de assets esenciales iniciado');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Obliga al Service Worker en espera a convertirse en el Service Worker activo de inmediato
        return self.skipWaiting();
      })
  );
});

// 2. EVENTO 'activate': Se activa cuando el SW toma el control de la aplicación.
// Aquí eliminamos versiones antiguas de la caché para liberar espacio de almacenamiento.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché obsoleta:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Permite que el SW tome el control de las páginas abiertas inmediatamente, sin recargar
      return self.clients.claim();
    })
  );
});

// 3. EVENTO 'fetch': Intercepta las solicitudes de red (Requisito obligatorio de Chromium para instalación).
// Estrategia: Network First (Red primero, con fallback a caché) para garantizar el contenido más fresco.
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET (las de recursos estáticos, páginas, etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la respuesta es válida y del mismo origen, la guardamos/actualizamos en la caché
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si falla la red (offline), buscamos la respuesta en la caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Si es una petición de navegación (HTML principal) y falla, devolvemos la raíz '/'
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }

          // Respuesta de fallback genérica para llamadas API u otros recursos offline
          return new Response('Contenido no disponible sin conexión a internet', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      })
  );
});

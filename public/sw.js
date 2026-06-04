const CACHE_NAME = "salud-conecta-v6";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/app-logo-v1.jpg"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA SW] Pre-caching offline support resources");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[PWA SW] Pre-cache warning: Some resources could not be cached on install", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[PWA SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Offline Fallback)
self.addEventListener("fetch", (event) => {
  // Only handle GET requests and skip API requests
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // NETWORK-FIRST: Para el HTML (Evita cargar un HTML viejo con hashes JS/CSS muertos)
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Fallback offline si no hay internet
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("/");
        });
      })
    );
  } else {
    // CACHE-FIRST: Para assets estáticos (JS, CSS, Imágenes)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          const isSafeToCache = event.request.url.startsWith(self.location.origin);
          if (isSafeToCache && networkResponse.status === 200) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
    );
  }
});

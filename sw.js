const CACHE_NAME = 'kids-letter-quiz-v2';
const appRoot = new URL('./', self.registration.scope);
const ASSETS = [
  appRoot.href,
  new URL('index.html', appRoot).href,
  new URL('manifest.webmanifest', appRoot).href,
  new URL('icon.svg', appRoot).href,
  new URL('icon-192.png', appRoot).href,
  new URL('icon-512.png', appRoot).href,
  new URL('apple-touch-icon.png', appRoot).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(appRoot.href, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(appRoot.href)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

const CACHE_NAME = 'purela-pharmacy-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/customer-display.html',
  '/styles.css',
  '/manifest.json?v=20260413',
  '/script.js?v=20260416'
];

function createOfflineResponse(contentType) {
  return new Response('', {
    status: 200,
    headers: { 'content-type': contentType }
  });
}

function createNetworkErrorJsonResponse() {
  return new Response(
    JSON.stringify({
      error: 'network_error',
      message: 'The request could not reach the server.'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'content-type': 'application/json' }
    }
  );
}

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const fails = [];
      for (const url of urlsToCache) {
        try {
          const res = await fetch(new Request(url, { cache: 'reload' }));
          if (res && res.ok) {
            await cache.put(url, res);
          } else {
            fails.push(url);
          }
        } catch (_) {
          fails.push(url);
        }
      }
      if (fails.length) {
        console.warn('[SW] Some assets failed to cache:', fails);
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim()).then(async () => {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(c => {
        c.postMessage({ type: 'SW_ACTIVATED', cache: CACHE_NAME });
      });
    })
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('livereload')) {
    return;
  }
  const isSameOrigin = new URL(url).origin === self.location.origin;
  if (
    isSameOrigin &&
    (
      event.request.destination === 'script' ||
      event.request.destination === 'style' ||
      url.endsWith('.js') ||
      url.endsWith('.css')
    )
  ) {
    event.respondWith((async () => {
      try {
        const res = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, res.clone());
        return res;
      } catch (_) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const contentType =
          event.request.destination === 'style' || url.endsWith('.css')
            ? 'text/css'
            : 'application/javascript';
        return createOfflineResponse(contentType);
      }
    })());
    return;
  }
  if (url.includes('supabase.co')) {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch (_) {
        return createNetworkErrorJsonResponse();
      }
    })());
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(async response => {
      if (response) return response;
      try {
        return await fetch(event.request);
      } catch (_) {
        return Response.error();
      }
    })
  );
});

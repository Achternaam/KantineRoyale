// Service worker: maakt Kantine Royale installeerbaar als app en laadt sneller.
// Altijd eerst het netwerk (zodat je na een update meteen de nieuwe versie hebt), de opgeslagen kopie alleen als het netwerk er niet is.
const CACHE = 'kantine-royale-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // de server, accounts en de verbinding voor het spel nooit uit een cache
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

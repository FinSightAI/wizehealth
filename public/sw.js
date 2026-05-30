const CACHE = 'vitara-v85';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg',
  '/wize-bottom-nav.js', '/wize-onboarding.js', '/wize-quickstart.js', '/wize-share.js', '/wize-hamburger.js', '/wize-track-beacon.js',
  'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// Listen for "user clicked Update" message — activate immediately
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Never intercept API calls
  if (url.pathname.startsWith('/api/')) return;
  // NETWORK-FIRST: always try the network so a fresh deploy reaches the user
  // immediately (cache-first was leaving clients stuck on a stale shell). Cache
  // is updated on every success and used only as an offline fallback.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

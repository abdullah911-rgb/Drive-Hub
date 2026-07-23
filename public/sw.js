const CACHE_NAME = 'nexttripy-v2'
const PRECACHE_URLS = ['/']

// Allow the registration component to force-activate this SW immediately
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event

  // Never intercept non-GET requests (POST, PUT, DELETE, etc.)
  // Returning without calling respondWith() lets the browser handle it natively
  if (request.method !== 'GET') return

  // Never intercept API calls — always go to network for fresh data
  if (request.url.includes('/api/')) return

  // For GET page/asset requests: network-first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache valid responses for same-origin requests
        if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

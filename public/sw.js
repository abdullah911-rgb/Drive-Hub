const CACHE_NAME = 'nexttripy-v3'

// Allow the registration component to force-activate this SW immediately
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('install', event => {
  // Do not precache HTML — Next.js pages/RSC payloads go stale and break Safari
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
}

function shouldBypass(url) {
  const { pathname } = url
  // Never cache API, Next internals, auth, or service worker itself
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname === '/sw.js') return true
  if (pathname.startsWith('/auth')) return true
  if (pathname.startsWith('/dashboard')) return true
  return false
}

function isStaticAsset(url) {
  return /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map)$/i.test(url.pathname) &&
    !url.pathname.startsWith('/_next/')
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  // Cross-origin: leave alone
  if (url.origin !== self.location.origin) return

  // Safari + Next.js: never intercept navigations / HTML / RSC / API
  if (isNavigationRequest(request) || shouldBypass(url)) return

  // Only cache same-origin static assets (images/fonts). Network-first with short cache.
  if (!isStaticAsset(url)) return

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {})
        }
        return response
      })
      .catch(() => caches.match(request).then(cached => cached || Response.error()))
  )
})

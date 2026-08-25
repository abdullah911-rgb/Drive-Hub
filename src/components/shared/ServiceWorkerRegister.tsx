'use client'
import { useEffect, useRef } from 'react'

export default function ServiceWorkerRegister() {
  const reloading = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Avoid SW-related breakage during local development (esp. Safari)
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      }).catch(() => {})
      return
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(registration => {
        registration.update().catch(() => {})

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })
      .catch(err => console.warn('[PWA] Service worker registration failed:', err))

    // Guard against infinite reload loops (common Safari SW issue)
    const onControllerChange = () => {
      if (reloading.current) return
      reloading.current = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}

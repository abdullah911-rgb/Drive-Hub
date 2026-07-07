'use client'
import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

function isDesktopDevice() {
  if (typeof navigator === 'undefined') return false
  return !isIOSDevice() && !isAndroidDevice()
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setIsInstalled(isStandaloneMode())
    setIsIOS(isIOSDevice())
    setIsAndroid(isAndroidDevice())
    setIsDesktop(isDesktopDevice())

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canNativeInstall = Boolean(deferredPrompt)
  const showInstallOption = !isInstalled && (canNativeInstall || isIOS || isAndroid || isDesktop)

  const install = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'unavailable' as const }
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }
    return choice
  }, [deferredPrompt])

  return {
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    canNativeInstall,
    showInstallOption,
    install,
  }
}

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
    const standalone = isStandaloneMode()
    setIsInstalled(standalone)
    setIsIOS(isIOSDevice())
    setIsAndroid(isAndroidDevice())
    setIsDesktop(isDesktopDevice())

    if (standalone) return

    // Capture any prompt that fired before this component mounted
    const win = window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }
    if (win.__pwaInstallPrompt) {
      setDeferredPrompt(win.__pwaInstallPrompt)
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      const prompt = e as BeforeInstallPromptEvent
      win.__pwaInstallPrompt = prompt
      setDeferredPrompt(prompt)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      delete win.__pwaInstallPrompt
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canNativeInstall = Boolean(deferredPrompt)
  // Always show install option unless already running in standalone (installed) mode
  const showInstallOption = !isInstalled

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

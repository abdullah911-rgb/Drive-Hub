'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { siteConfig } from '@/lib/seo'

interface InstallAppButtonProps {
  variant?: 'navbar' | 'footer' | 'menu'
  className?: string
}

export default function InstallAppButton({ variant = 'navbar', className = '' }: InstallAppButtonProps) {
  const { isInstalled, isIOS, isAndroid, isDesktop, canNativeInstall, showInstallOption, install } = usePwaInstall()
  const [guideOpen, setGuideOpen] = useState(false)

  if (!showInstallOption) return null

  const handleClick = async () => {
    if (canNativeInstall) {
      const result = await install()
      if (result.outcome === 'accepted') {
        toast.success(`${siteConfig.shortName} added to your apps!`)
      }
      return
    }
    setGuideOpen(true)
  }

  const buttonClass = variant === 'footer'
    ? 'btn-primary text-sm px-5 py-2.5 font-semibold inline-flex items-center gap-2'
    : variant === 'menu'
      ? 'w-full flex items-center justify-center gap-2 btn-secondary text-sm font-semibold py-2.5'
      : 'flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card/20 text-foreground hover:bg-elevated transition-all text-sm font-semibold'

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${buttonClass} ${className}`}
        aria-label="Install app shortcut"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
        </svg>
        {variant === 'footer' ? 'Install App' : 'Install App'}
      </button>

      <AnimatePresence>
        {guideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setGuideOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              className="glass-card w-full max-w-md p-6 border border-border shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">Add {siteConfig.shortName} to your device</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Open the marketplace like an app — no browser needed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {isIOS && (
                  <GuideBlock
                    title="iPhone / iPad (Safari)"
                    steps={[
                      'Tap the Share button at the bottom of Safari',
                      'Scroll down and tap "Add to Home Screen"',
                      'Tap "Add" — the app icon will appear on your home screen',
                    ]}
                  />
                )}

                {isAndroid && !canNativeInstall && (
                  <GuideBlock
                    title="Android (Chrome)"
                    steps={[
                      'Tap the menu (⋮) in the top-right corner',
                      'Tap "Install app" or "Add to Home screen"',
                      'Confirm — the shortcut will appear in your app drawer',
                    ]}
                  />
                )}

                {isDesktop && (
                  <>
                    <GuideBlock
                      title="Chrome / Edge (Windows & Mac)"
                      steps={[
                        'Look for the install icon (⊕ or computer) in the address bar',
                        'Click it, then click "Install"',
                        'The app opens in its own window and appears in your apps list',
                      ]}
                    />
                    <GuideBlock
                      title="Safari (Mac)"
                      steps={[
                        'Click File in the menu bar',
                        'Select "Add to Dock"',
                        'Launch DriveHub directly from your Dock',
                      ]}
                    />
                  </>
                )}

                {!isIOS && !isAndroid && !isDesktop && (
                  <GuideBlock
                    title="Your browser"
                    steps={[
                      'Open your browser menu',
                      'Look for "Install app" or "Add to Home screen"',
                      'Follow the prompts to create a shortcut',
                    ]}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="btn-primary w-full py-3 mt-6 font-bold"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function GuideBlock({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="glass rounded-xl p-4 border border-white/5">
      <p className="text-sm font-semibold text-white mb-2">{title}</p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2 text-xs text-slate-400">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

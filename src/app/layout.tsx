import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister'
import JsonLd from '@/components/seo/JsonLd'
import { siteConfig, metadataBase, organizationJsonLd, websiteJsonLd } from '@/lib/seo'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'NextTripy Marketplace — Rent · Stay · Explore',
    template: '%s | NextTripy',
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: 'NextTripy', url: siteConfig.url }],
  creator: 'NextTripy',
  publisher: 'NextTripy',
  applicationName: siteConfig.shortName,
  category: 'Automotive',
  openGraph: {
    title: 'NextTripy — Car Rentals & Hotel Rooms Worldwide',
    description: siteConfig.description,
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: siteConfig.url,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextTripy — Car Rentals & Hotel Rooms Worldwide',
    description: siteConfig.description,
    images: ['/opengraph-image'],
    creator: siteConfig.twitterHandle,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: siteConfig.url },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: siteConfig.shortName,
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563EB' },
    { media: '(prefers-color-scheme: dark)', color: '#2563EB' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground antialiased transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ServiceWorkerRegister />
          {children}
          <Toaster
            theme="system"
            position="top-right"
            toastOptions={{
              className: 'glass border border-border text-foreground font-sans rounded-xl shadow-lg',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}

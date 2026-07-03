import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/shared/ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'DriveHub Marketplace — Find Car Rentals Worldwide', template: '%s | DriveHub Marketplace' },
  description: 'Connect with trusted car rental companies and individual car owners worldwide. Browse vehicles, view details, and contact owners directly on WhatsApp.',
  keywords: ['car rental', 'global car rental', 'vehicle rental', 'rent a car', 'car marketplace', 'DriveHub'],
  authors: [{ name: 'DriveHub' }],
  openGraph: {
    title: 'DriveHub Marketplace — Global Car Rentals',
    description: 'Find and rent cars from trusted companies worldwide.',
    type: 'website',
    locale: 'en_US',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground antialiased transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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

import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import MarketplaceShell from './MarketplaceShell'

export const metadata: Metadata = buildPageMetadata({
  title: 'Browse Rental Cars',
  description:
    'Browse and filter available rental cars by country, brand, fuel type, and transmission. Contact owners directly on WhatsApp.',
  path: '/marketplace',
  keywords: ['browse rental cars', 'car rental listings', 'rent a car online', 'vehicle marketplace'],
})

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceShell>{children}</MarketplaceShell>
}

import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'About Us',
  description:
    'Learn about DriveHub Marketplace — a global platform connecting travelers with verified car rental companies and hotels.',
  path: '/about',
  keywords: ['about DriveHub', 'car rental platform', 'verified car rental companies', 'hotel listings'],
})

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}

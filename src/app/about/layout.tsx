import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'About Us',
  description:
    'Learn about NextTripy Marketplace — a global car rental platform connecting travelers with verified rental companies and independent car owners.',
  path: '/about',
  keywords: ['about NextTripy', 'car rental platform', 'verified car rental companies'],
})

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}

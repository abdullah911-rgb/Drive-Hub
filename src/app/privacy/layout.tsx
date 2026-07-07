import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'DriveHub Marketplace privacy policy — how we collect, use, and protect your personal information.',
  path: '/privacy',
  noIndex: false,
})

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}

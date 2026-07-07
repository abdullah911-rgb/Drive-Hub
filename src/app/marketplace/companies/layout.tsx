import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Rental Companies',
  description:
    'Browse verified car rental companies on DriveHub. View fleet sizes, ratings, and contact companies directly on WhatsApp.',
  path: '/marketplace/companies',
  keywords: ['car rental companies', 'verified rental partners', 'fleet rental companies'],
})

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return children
}

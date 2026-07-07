import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Sign In or Register',
  description: 'Sign in or create an account on DriveHub Marketplace to browse cars, register your company, or manage your fleet.',
  path: '/auth',
  noIndex: true,
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}

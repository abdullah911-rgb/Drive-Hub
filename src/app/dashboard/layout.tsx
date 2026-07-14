import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import DashboardShell from './DashboardShell'

export const metadata: Metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Manage your NextTripy account, fleet, and subscriptions.',
  path: '/dashboard',
  noIndex: true,
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}

import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist on DriveHub Marketplace.',
  path: '/404',
  noIndex: true,
})

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-heading font-black text-6xl text-white mb-4">404</h1>
      <h2 className="font-heading font-bold text-2xl text-white mb-3">Page Not Found</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn-primary px-8 py-3 font-bold rounded-xl">
        Back to Home
      </Link>
    </div>
  )
}

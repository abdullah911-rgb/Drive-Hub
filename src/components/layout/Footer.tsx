import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-28">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="NextTripy Logo" width={36} height={36} className="rounded-md" />
              <span className="font-heading font-bold text-lg text-slate-900 dark:text-white">NextTripy</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              A friendly marketplace for car rentals and hotel rooms. We help you find great options — you book directly with the provider.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/marketplace', label: 'Browse Cars' },
                { href: '/marketplace/rooms', label: 'Browse Hotels' },
                { href: '/marketplace/companies', label: 'Partners' },
                { href: '/auth', label: 'Sign In' },
                { href: '/auth?tab=signup', label: 'Register' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms & Conditions' },
                { href: '/contact', label: 'Contact Us' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-4 flex flex-col items-center justify-center text-center gap-1.5">
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-2xl">
            NextTripy is a marketplace platform only. Rental and hotel agreements are made directly between customers and companies.
          </p>
          <p className="text-slate-600 dark:text-slate-500 text-sm font-medium">
            © 2026 NextTripy Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

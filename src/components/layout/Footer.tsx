import Link from 'next/link'
import InstallAppButton from '@/components/shared/InstallAppButton'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-dark-900/80 mt-20">
      <div className="container-app py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-base shadow-neon-violet">D</div>
              <span className="font-heading font-bold text-xl gradient-text">DriveHub</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Global marketplace for car rentals and hotel rooms. Connecting customers with trusted companies and hotel partners worldwide.
            </p>
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg">
                <span className="text-sm">🌍</span>
                <span className="text-xs text-slate-400">Global Coverage</span>
              </div>
              <InstallAppButton variant="footer" />
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Platform</h4>
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
                  <Link href={l.href} className="text-slate-400 hover:text-primary transition-colors text-sm">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms & Conditions' },
                { href: '/contact', label: 'Contact Us' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-400 hover:text-primary transition-colors text-sm">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} DriveHub Marketplace. All rights reserved.</p>
          <p className="text-slate-600 text-xs">
            DriveHub is a marketplace platform only. Rental and hotel agreements are made directly between customers and companies.
          </p>
        </div>
      </div>
    </footer>
  )
}

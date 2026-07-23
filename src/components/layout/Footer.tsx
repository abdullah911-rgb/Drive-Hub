import Link from 'next/link'
import Image from 'next/image'
import InstallAppButton from '@/components/shared/InstallAppButton'

const exploreLinks = [
  { href: '/marketplace', label: 'Browse Cars' },
  { href: '/marketplace/rooms', label: 'Hotel Rooms' },
  { href: '/marketplace/companies', label: 'Partners' },
  { href: '/#brands', label: 'Popular Brands' },
]

const companyLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-0 overflow-hidden border-t border-white/10 bg-[#0B1220] text-slate-300">
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 right-1/5 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>

      <div className="container-app relative z-10 px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="NextTripy Logo"
                width={40}
                height={40}
                className="rounded-lg ring-1 ring-white/10 transition-transform group-hover:scale-105"
              />
              <span className="font-heading text-xl font-black tracking-tight text-white">
                Next<span className="text-primary">Tripy</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Your travel marketplace for trusted car rentals and hotel rooms.
              Browse listings and book directly with local partners on WhatsApp.
            </p>
            <div className="mt-5">
              <InstallAppButton variant="footer" />
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-white">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-primary"
                  >
                    <span className="h-px w-0 bg-primary transition-all group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-white">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-primary"
                  >
                    <span className="h-px w-0 bg-primary transition-all group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-white">
              Get in touch
            </h3>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Questions about listings, partnerships, or your account? Reach out anytime.
            </p>
            <div className="mt-5 space-y-3">
              <a
                href="mailto:info@nexttripy.com"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-slate-300 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</span>
                  info@nexttripy.com
                </span>
              </a>
              <a
                href="https://wa.me/923395007019?text=Hello%2C%20I%20need%20help%20with%20NextTripy%20Marketplace."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-slate-300 transition-all hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">WhatsApp</span>
                  Chat with support
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {year} NextTripy. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Cars · Hotels · Direct WhatsApp booking
          </p>
        </div>
      </div>
    </footer>
  )
}

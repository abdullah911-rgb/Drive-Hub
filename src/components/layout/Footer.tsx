import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { href: '/marketplace', label: 'Cars' },
  { href: '/marketplace/rooms', label: 'Hotels' },
  { href: '/marketplace/companies', label: 'Partners' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-0 overflow-hidden border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#070B14]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" aria-hidden />

      <div className="container-app relative z-10 px-6 py-4 md:py-5">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Link href="/" className="group inline-flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NextTripy Logo"
              width={28}
              height={28}
              className="rounded-lg ring-1 ring-slate-200 transition-transform group-hover:scale-105 dark:ring-white/10"
            />
            <span className="font-heading text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Next<span className="text-primary">Tripy</span>
            </span>
          </Link>

          <p className="mt-1.5 max-w-lg text-xs font-medium leading-snug text-slate-600 dark:text-slate-300 sm:text-sm">
            Find your next car or stay from trusted local partners — book directly on WhatsApp.
          </p>

          <nav
            aria-label="Footer"
            className="mt-2.5 flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0.5"
          >
            {navLinks.map((link, i) => (
              <span key={link.href} className="inline-flex items-center">
                {i > 0 && (
                  <span
                    className="mx-1 hidden h-0.5 w-0.5 rounded-full bg-slate-300 sm:inline-block dark:bg-slate-600"
                    aria-hidden
                  />
                )}
                <Link
                  href={link.href}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary dark:text-slate-200 dark:hover:bg-primary/20 dark:hover:text-primary"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>

          <div className="mt-2.5 flex items-center justify-center gap-2">
            <Link
              href="/marketplace"
              className="btn-primary px-4 py-1.5 text-xs font-bold"
            >
              Browse cars
            </Link>
            <Link
              href="/marketplace/rooms"
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-800 transition-all hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-primary/50 dark:hover:text-primary"
            >
              Find hotels
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-3 flex max-w-4xl flex-col items-center justify-between gap-1 border-t border-slate-200 pt-2.5 text-center sm:flex-row sm:text-left dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            © {year} NextTripy. All rights reserved.
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Cars · Hotels · Direct WhatsApp booking
          </p>
        </div>
      </div>
    </footer>
  )
}

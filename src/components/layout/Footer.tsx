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
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
        <div className="absolute top-0 left-1/2 h-40 w-[min(90%,720px)] -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/20" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-secondary/10 blur-3xl dark:bg-secondary/15" />
        <div className="absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
      </div>

      <div className="container-app relative z-10 px-6 py-12 md:py-16">
        {/* Brand statement — one composition */}
        <div className="mx-auto max-w-3xl text-center">
          <Link href="/" className="group inline-flex flex-col items-center gap-3">
            <Image
              src="/logo.png"
              alt="NextTripy Logo"
              width={52}
              height={52}
              className="rounded-2xl shadow-md ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-105 dark:ring-white/10"
            />
            <span className="font-heading text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Next<span className="text-primary">Tripy</span>
            </span>
          </Link>

          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
            Find your next car or stay from trusted local partners — then book directly on WhatsApp.
          </p>
        </div>

        {/* Horizontal nav */}
        <nav
          aria-label="Footer"
          className="mx-auto mt-9 flex max-w-3xl flex-wrap items-center justify-center gap-x-1 gap-y-2"
        >
          {navLinks.map((link, i) => (
            <span key={link.href} className="inline-flex items-center">
              {i > 0 && (
                <span
                  className="mx-2 hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block dark:bg-slate-600"
                  aria-hidden
                />
              )}
              <Link
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary dark:text-slate-200 dark:hover:bg-primary/20 dark:hover:text-primary"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>

        {/* Accent CTA row */}
        <div className="mx-auto mt-10 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/marketplace"
            className="btn-primary px-6 py-2.5 text-sm font-bold shadow-md"
          >
            Browse cars
          </Link>
          <Link
            href="/marketplace/rooms"
            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-800 transition-all hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-primary/50 dark:hover:text-primary"
          >
            Find hotels
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 text-center sm:flex-row sm:text-left dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            © {year} NextTripy. All rights reserved.
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cars · Hotels · Direct WhatsApp booking
          </p>
        </div>
      </div>
    </footer>
  )
}

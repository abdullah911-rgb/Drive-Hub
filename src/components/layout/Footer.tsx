import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900 dark:bg-black mt-0">
      <div className="container-app py-3 px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="NextTripy Logo" width={24} height={24} className="rounded" />
            <span className="font-heading font-bold text-sm text-white">
              Next<span className="text-primary">Tripy</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/about" className="text-slate-400 hover:text-primary transition-colors">About</Link>
            <Link href="/marketplace" className="text-slate-400 hover:text-primary transition-colors">Cars</Link>
            <Link href="/marketplace/rooms" className="text-slate-400 hover:text-primary transition-colors">Hotels</Link>
            <Link href="/contact" className="text-slate-400 hover:text-primary transition-colors">Contact</Link>
          </div>
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} NextTripy
          </p>
        </div>
      </div>
    </footer>
  )
}

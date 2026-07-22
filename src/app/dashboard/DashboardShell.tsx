'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
      <ParticleBackground />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      <Navbar />
      <main className="flex-grow pt-20 pb-10 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  )
}

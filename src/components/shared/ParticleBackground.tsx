'use client'

export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute -top-24 right-0 w-[520px] h-[420px] bg-primary/[0.07] rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-0 -left-16 w-[440px] h-[360px] bg-secondary/[0.05] rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
    </div>
  )
}

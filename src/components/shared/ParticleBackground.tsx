'use client'

export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background transition-colors duration-300">
      <div className="blob-container">
        <div className="blob-el blob-1" />
        <div className="blob-el blob-2" />
        <div className="blob-el blob-3" />
      </div>
    </div>
  )
}

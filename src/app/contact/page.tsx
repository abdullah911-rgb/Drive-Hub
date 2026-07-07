'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)
    setTimeout(() => {
      toast.success('Your message has been sent successfully!')
      setForm({ name: '', email: '', subject: '', message: '' })
      setSubmitting(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <ParticleBackground />

      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-24 pb-16 relative z-10 container-app">

        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
            Get in Touch
          </span>
          <h1 className="font-heading font-black text-4xl text-white mb-4">
            Contact <span className="gradient-text">DriveHub</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Have questions about our marketplace, list verification, or subscription plans? Our global team is here to help. Reach out directly or send us a message below.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-2 glass px-4 py-2 rounded-xl border border-white/5">
              ✉️ <span className="font-medium">support@drivehub.com</span>
            </span>
            <span className="flex items-center gap-2 glass px-4 py-2 rounded-xl border border-white/5">
              💬 <span className="font-medium">Direct Help Chat Available</span>
            </span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-6 md:p-10 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-heading font-black text-xl text-white mb-6">Send Us a Message</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Your Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input w-full bg-dark-900/60"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input w-full bg-dark-900/60"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Subject</label>
                <input
                  type="text"
                  placeholder="Inquiry about pricing/listings"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input w-full bg-dark-900/60"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us what you need help with..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input w-full bg-dark-900/60 resize-none py-2"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3.5 rounded-xl font-bold shadow-neon-violet hover:shadow-neon-violet-lg transition-all text-xs"
              >
                {submitting ? 'Sending Message...' : 'Submit Message'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

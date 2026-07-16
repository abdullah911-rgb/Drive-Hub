'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Your message has been sent! We'll get back to you shortly.")
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <ParticleBackground />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-20 pb-12 relative z-10">
        <div className="container-app max-w-6xl mx-auto">

          {/* Page header — compact */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="font-heading font-black text-3xl md:text-4xl text-slate-900 dark:text-white mb-2">
              Contact <span className="text-primary">NextTripy</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium max-w-lg mx-auto">
              Questions about listings, subscriptions, or partnerships? We&apos;re here to help.
            </p>

            {/* Contact badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg border border-border text-slate-700 dark:text-slate-300 font-semibold text-xs">
                ✉️ nexttripy@nexttripy.com
              </span>
              <a
                href="https://wa.me/923395007019?text=Hello%2C%20I%20need%20help%20with%20NextTripy%20Marketplace."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </motion.div>

          {/* 2-column: form left, images right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* LEFT — Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="glass-card p-6 border border-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white mb-5">Send Us a Message</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1 block">Your Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1 block">Email Address</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1 block">Subject</label>
                    <input
                      type="text"
                      placeholder="Inquiry about pricing/listings"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1 block">Message</label>
                    <textarea
                      rows={4}
                      placeholder="Tell us what you need help with..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="input w-full resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 rounded-xl font-bold transition-all text-sm"
                  >
                    {submitting ? 'Sending...' : 'Submit Message'}
                  </button>
                </form>
              </div>

              {/* Info cards below form */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { icon: '⚡', title: 'Fast Reply', desc: 'Within 24 hours' },
                  { icon: '🌍', title: 'Global Support', desc: '25+ countries' },
                  { icon: '🔒', title: 'Secure', desc: 'Your data is safe' },
                ].map(item => (
                  <div key={item.title} className="glass-card p-3 text-center border border-border">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT — Hero images (compact) */}
            <motion.div
              className="relative w-full h-[340px] items-center justify-center hidden lg:flex"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Backglow */}
              <div className="absolute w-[75%] h-[75%] bg-gradient-to-tr from-primary-500/20 to-secondary-500/20 blur-3xl rounded-full opacity-50 -z-10" />

              {/* Main image: Car */}
              <div className="absolute top-3 left-3 w-[72%] h-[56%] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <Image
                  src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                  alt="Luxury rental car"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                  🚗 Premium Fleets
                </div>
              </div>

              {/* Overlapping image: Hotel Room */}
              <div className="absolute bottom-3 right-3 w-[68%] h-[54%] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <Image
                  src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"
                  alt="Luxury hotel room"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                  🏨 Verified Stays
                </div>
              </div>

              {/* Floating Badge: Rating */}
              <div className="absolute top-[42%] -right-2 bg-card/90 backdrop-blur-lg border border-border rounded-xl p-2.5 shadow-xl flex items-center gap-2 animate-float">
                <span className="text-lg">⭐</span>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">4.9/5 Rating</div>
                  <div className="text-[10px] text-slate-500">1,200+ Reviews</div>
                </div>
              </div>

              {/* Floating Badge: WhatsApp */}
              <div
                className="absolute bottom-[30%] -left-3 bg-card/90 backdrop-blur-lg border border-border rounded-xl p-2.5 shadow-xl flex items-center gap-2 animate-float"
                style={{ animationDelay: '2s' }}
              >
                <span className="text-lg">💬</span>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">WhatsApp Booking</div>
                  <div className="text-[10px] text-slate-500">Direct with providers</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}

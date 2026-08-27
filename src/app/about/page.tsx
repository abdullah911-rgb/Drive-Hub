'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'
import { COUNTRIES } from '@/lib/countries'

export default function AboutPage() {
  const features = [
    {
      title: 'Cars and hotel rooms',
      desc: 'Whether you need a car for the weekend or a room for the night, you can find both here — all from trusted local businesses.',
    },
    {
      title: 'Easy WhatsApp contact',
      desc: 'When you find something you like, just message the provider on WhatsApp. No middlemen, no extra fees from us.',
    },
    {
      title: 'Verified partners',
      desc: 'Every company and hotel goes through a review process before they can list, so you can browse with confidence.',
    },
    {
      title: 'Honest reviews',
      desc: 'Read what other customers have to say before you reach out. Real ratings from real renters.',
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-20 pb-16 relative z-10">
        <div className="container-app max-w-4xl mx-auto px-6">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16" style={{ alignItems: 'start' }}>
          <div className="lg:col-span-7">
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 dark:text-white mb-4 leading-tight">
                Helping you find the right ride and the right stay
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                NextTripy is a marketplace that brings together car rental companies and hotels in one easy-to-browse place.
                We&apos;re not a booking agency — we simply help you discover great options and connect with providers directly.
              </p>
            </motion.div>

            <div className="space-y-4">
              <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                How it works
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Rental companies and hotels register with us, upload their listings, and get approved by our team.
                You search by location, compare options, and when you&apos;re ready — reach out on WhatsApp to arrange the details.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Prices, availability, and payment are always agreed between you and the provider. We&apos;re here to make discovery simple, not to get in the way.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="glass-card p-6 space-y-5">
              <div>
                <h4 className="text-slate-500 dark:text-slate-500 text-xs font-semibold mb-3 uppercase tracking-wider">Countries we currently serve</h4>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border text-sm bg-elevated/50">
                      <Image src={c.flagUrl} alt={c.name} width={16} height={12} className="w-4 h-3 object-cover rounded-sm" />
                      <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
            Why people use NextTripy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card p-5"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-2">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}

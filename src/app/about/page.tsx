'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'
import { COUNTRIES } from '@/lib/countries'

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const features = [
    {
      icon: '🚗',
      title: 'Cars & Hotel Rooms',
      desc: 'From budget-friendly cars to premium luxury SUVs and hotel suites — browse hundreds of verified listings suited for every trip.'
    },
    {
      icon: '💬',
      title: 'Direct WhatsApp Contact',
      desc: 'No middleman, no hidden fees. Chat directly with car rental companies or hotel partners to negotiate terms and confirm bookings.'
    },
    {
      icon: '🔒',
      title: 'Verified Partners',
      desc: 'We review and verify registration documents, licenses, and business identities for all car rental companies and hotel partners.'
    },
    {
      icon: '⭐',
      title: 'Transparent Marketplace',
      desc: 'View ratings, customer reviews, and clear details for every car and hotel room before making your decision.'
    }
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <ParticleBackground />

      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-24 pb-16 relative z-10 container-app max-w-6xl">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
              Our Journey
            </span>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
              About <span className="gradient-text">DriveHub</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              We are a premier global marketplace connecting travelers with trusted car rental companies and hotel partners across multiple countries — all in one platform.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 items-center">
          <motion.div
            className="lg:col-span-7 space-y-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
              Connecting People with <span className="gradient-text">Cars &amp; Hotels</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              DriveHub is a cross-border platform designed to bring transparency, safety, and speed to both car rental and hotel room booking. By bridging the gap between customers, trusted car rental companies, and hotel partners, we make your entire trip seamless.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Whether you are an international traveler needing a car, a family booking a hotel suite, or a local business listing their fleet or rooms, DriveHub offers verified listings, authentic reviews, and zero-fee direct communication via WhatsApp.
            </p>
          </motion.div>

          <motion.div
            className="lg:col-span-5"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              initial: { opacity: 0, x: 30 },
              animate: { opacity: 1, x: 0, transition: { duration: 0.6 } }
            }}
          >
            <div className="glass-card p-8 border border-white/5 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-2">
                <h4 className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Our Mission</h4>
                <p className="text-white text-base font-semibold leading-relaxed">
                  &ldquo;To build a trusted, transparent, and direct marketplace that empowers car rental companies and hotels to reach customers worldwide — and gives travelers a seamless, one-stop booking experience.&rdquo;
                </p>
              </div>
              <div className="border-t border-white/5 pt-6 space-y-2">
                <h4 className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Supported Countries</h4>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map(c => (
                    <div key={c.id} className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg border border-white/5">
                      <Image src={c.flagUrl} alt={c.name} width={16} height={12} className="w-4 h-3 object-cover rounded-sm" />
                      <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-white mb-4">
              Why People Choose <span className="gradient-text">DriveHub</span>
            </h2>
            <p className="text-slate-400 text-sm">
              We design our marketplace tools around trust, simplicity, and cost efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card p-6 sm:p-8 border border-white/5 hover:border-primary/20 hover:shadow-neon-violet transition-all duration-300 flex gap-4"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                  {f.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-heading font-bold text-white text-base sm:text-lg">{f.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

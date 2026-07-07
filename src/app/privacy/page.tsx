'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <ParticleBackground />

      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-24 pb-16 relative z-10 container-app max-w-4xl">
        <div className="glass-card p-8 md:p-12 border border-white/5">
          <h1 className="font-heading font-black text-3xl text-white mb-6">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-slate-400 text-xs mb-8">Last updated: June 19, 2026</p>

          <div className="flex flex-col gap-6 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-bold text-lg mb-3">1. Information We Collect</h2>
              <p>
                To provide a trusted vehicle rental marketplace globally across our supported countries, we collect:
              </p>
              <ul className="list-disc pl-5 mt-2 flex flex-col gap-1.5">
                <li>**Personal Identity Details**: Full Name, Father's Name, CNIC, Passport/Resident ID, Date of Birth.</li>
                <li>**Contact Details**: Email Address, Phone Number, WhatsApp Number, and emergency contacts.</li>
                <li>**Verification Documents**: Company licenses and vehicle registration/insurance documents.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">2. How We Use Your Information</h2>
              <p>
                We use the collected information to verify rental partners, protect customers from fraudulent listings, and facilitate direct connection via WhatsApp. We do not sell or lease your identity documents to third-party advertisers.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">3. Sharing Information with Partners</h2>
              <p>
                When you click "Connect on WhatsApp" or request rental information, your customer profile status (e.g. Approved/Verified) may be shared with the rental company to establish trust before releasing vehicles.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">4. Security of Verification Files</h2>
              <p>
                Identity files, CNIC photos, and company registrations are uploaded securely and are restricted to platform administrators for approval verification only. They are encrypted at rest and in transit.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">5. Your Rights</h2>
              <p>
                You may request account deletion, data modification, or download a copy of your personal verification records by contacting our support desk.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

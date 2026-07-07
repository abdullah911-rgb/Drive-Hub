'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ParticleBackground from '@/components/shared/ParticleBackground'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <ParticleBackground />

      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-24 pb-16 relative z-10 container-app max-w-4xl">
        <div className="glass-card p-8 md:p-12 border border-white/5">
          <h1 className="font-heading font-black text-3xl text-white mb-6">
            Terms & <span className="gradient-text">Conditions</span>
          </h1>
          <p className="text-slate-400 text-xs mb-8">Last updated: June 19, 2026</p>

          <div className="flex flex-col gap-6 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-bold text-lg mb-3">1. Platform Nature</h2>
              <p>
                DriveHub is an intermediary vehicle marketplace. We connect registered car rental companies and individual owners with prospective customers. DriveHub **does not own, operate, or maintain** the vehicles listed on this marketplace, and we do not act as an escrow agent for rental payments.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">2. Direct Dealing & WhatsApp Chats</h2>
              <p>
                All rental bookings, pricing deals, vehicle handovers, security deposits, and insurance claims are negotiated **directly** between the customer and the listing company via WhatsApp or call. DriveHub is not liable for vehicle defects, mechanical issues, cancellation of rentals, or loss of deposits.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">3. Verification Responsibility</h2>
              <p>
                While we vet partner company licenses and verify customer profiles before approving them on the platform, users must exercise due diligence. Customers should check the vehicle condition, registration papers, and signing contract details upon vehicle delivery.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">4. Subscription Billing</h2>
              <p>
                Rental companies must purchase a Standard Market Plan subscription to list up to 10 vehicles. Subscriptions are billed monthly and are non-refundable once activated by platform administrators. Listings will be automatically hidden if a subscription expires.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">5. Termination & Suspension</h2>
              <p>
                We reserve the right to ban or suspend any user or company profile that lists unsafe vehicles, submits fraudulent documents, charges hidden fees, or violates local motor vehicle rental regulations in their respective operating countries.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

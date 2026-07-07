import { getFeaturedCars, getFeaturedCompanies, getMarketplaceStats } from '@/lib/data'
import LandingPageClient from './LandingPageClient'
import type { Car, Company } from '@/types'

export const revalidate = 60

const emptyStats = { carCount: 0, companyCount: 0, brandCount: 0 }

export default async function LandingPage() {
  let cars: Car[] = []
  let companies: Company[] = []
  let stats = emptyStats

  try {
    const [fetchedCars, fetchedCompanies, fetchedStats] = await Promise.all([
      getFeaturedCars(6),
      getFeaturedCompanies(4),
      getMarketplaceStats(),
    ])
    cars = fetchedCars as unknown as Car[]
    companies = fetchedCompanies as unknown as Company[]
    stats = fetchedStats
  } catch {
  }

  return (
    <LandingPageClient
      initialCars={cars}
      initialCompanies={companies}
      stats={stats}
    />
  )
}

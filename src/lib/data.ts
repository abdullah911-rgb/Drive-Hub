import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'
import { serializePrisma } from './serialize'

const carListInclude = {
  images: { take: 1, orderBy: { isPrimary: 'desc' as const } },
  country: { select: { id: true, name: true, code: true } },
  city: { select: { id: true, name: true } },
  company: {
    select: {
      id: true,
      name: true,
      whatsAppNumber: true,
      status: true,
      country: { select: { name: true } },
    },
  },
}

const approvedCarWhere = {
  deletedAt: null,
  status: 'APPROVED' as const,
  company: {
    status: 'APPROVED' as const,
    subscriptions: { some: { status: 'ACTIVE' as const } },
  },
}

export const getCachedCountries = unstable_cache(
  async () => {
    const list = await prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, flagUrl: true, currency: true },
    })
    return serializePrisma(list)
  },
  ['countries'],
  { revalidate: 86400 }
)

export const getFeaturedCars = unstable_cache(
  async (limit = 6) => {
    const cars = await prisma.car.findMany({
      where: approvedCarWhere,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: carListInclude,
    })
    return serializePrisma(cars)
  },
  ['featured-cars'],
  { revalidate: 60 }
)

export const getFeaturedCompanies = unstable_cache(
  async (limit = 4) => {
    const companies = await prisma.company.findMany({
      where: { deletedAt: null, status: 'APPROVED' },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        whatsAppNumber: true,
        businessAddress: true,
        country: { select: { name: true, code: true } },
        city: { select: { name: true } },
        reviews: { where: { isVisible: true }, select: { rating: true } },
        _count: { select: { cars: { where: { status: 'APPROVED', deletedAt: null } } } },
      },
    })
    return serializePrisma(
      companies.map((c) => {
        const avg = c.reviews.length
          ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
          : 0
        const { reviews, _count, ...rest } = c
        return {
          ...rest,
          averageRating: Math.round(avg * 10) / 10,
          totalReviews: reviews.length,
          totalCars: _count.cars,
        }
      })
    )
  },
  ['featured-companies'],
  { revalidate: 60 }
)

export const getMarketplaceStats = unstable_cache(
  async () => {
    const [carCount, companyCount, brands, countryCount] = await Promise.all([
      prisma.car.count({ where: approvedCarWhere }),
      prisma.company.count({ where: { deletedAt: null, status: 'APPROVED' } }),
      prisma.car.findMany({
        where: approvedCarWhere,
        distinct: ['brand'],
        select: { brand: true },
      }),
      prisma.company.findMany({
        where: { deletedAt: null, status: 'APPROVED' },
        distinct: ['countryId'],
        select: { countryId: true },
      }),
    ])
    return { carCount, companyCount, brandCount: brands.length, countryCount: countryCount.length }
  },
  ['marketplace-stats'],
  { revalidate: 300 }
)

export async function getCarForMetadata(id: string) {
  return prisma.car.findFirst({
    where: { id, deletedAt: null, status: 'APPROVED' },
    select: {
      id: true,
      name: true,
      brand: true,
      model: true,
      year: true,
      description: true,
      fuelType: true,
      transmission: true,
      seatingCapacity: true,
      images: { take: 1, orderBy: { isPrimary: 'desc' } },
      country: { select: { name: true } },
      company: { select: { name: true } },
    },
  })
}

export async function getCompanyForMetadata(id: string) {
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null, status: 'APPROVED' },
    select: {
      id: true,
      name: true,
      businessAddress: true,
      whatsAppNumber: true,
      country: { select: { name: true } },
      reviews: { where: { isVisible: true }, select: { rating: true } },
    },
  })
  if (!company) return null
  const avg = company.reviews.length
    ? company.reviews.reduce((s, r) => s + r.rating, 0) / company.reviews.length
    : 0
  const { reviews, ...rest } = company
  return {
    ...rest,
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: reviews.length,
  }
}

export async function getSitemapEntries() {
  const [cars, companies] = await Promise.all([
    prisma.car.findMany({
      where: approvedCarWhere,
      select: { id: true, updatedAt: true },
    }),
    prisma.company.findMany({
      where: { deletedAt: null, status: 'APPROVED' },
      select: { id: true, updatedAt: true },
    }),
  ])
  return { cars, companies }
}

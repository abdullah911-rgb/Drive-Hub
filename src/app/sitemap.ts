import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'
import { getSitemapEntries } from '@/lib/data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/marketplace/companies`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const { cars, companies } = await getSitemapEntries()
    const carPages: MetadataRoute.Sitemap = cars.map((car) => ({
      url: `${base}/marketplace/cars/${car.id}`,
      lastModified: car.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
    const companyPages: MetadataRoute.Sitemap = companies.map((company) => ({
      url: `${base}/marketplace/companies/${company.id}`,
      lastModified: company.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
    return [...staticPages, ...carPages, ...companyPages]
  } catch {
    return staticPages
  }
}

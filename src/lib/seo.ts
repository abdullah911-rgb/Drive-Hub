import type { Metadata } from 'next'

export const siteConfig = {
  name: 'DriveHub Marketplace',
  shortName: 'DriveHub',
  description:
    'Connect with trusted car rental companies and individual car owners worldwide. Browse vehicles, view details, and contact owners directly on WhatsApp.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://drivehub.com',
  locale: 'en_US',
  twitterHandle: '@drivehub',
  keywords: [
    'car rental',
    'global car rental',
    'vehicle rental',
    'rent a car',
    'car marketplace',
    'DriveHub',
    'rental cars worldwide',
    'WhatsApp car rental',
  ],
}

export const metadataBase = new URL(siteConfig.url)

export function buildPageMetadata({
  title,
  description,
  path = '',
  keywords,
  noIndex = false,
  image,
}: {
  title: string
  description: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
  image?: string
}): Metadata {
  const url = `${siteConfig.url}${path}`
  const ogImage = image || `${siteConfig.url}/opengraph-image`

  return {
    title,
    description,
    keywords: keywords || siteConfig.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: siteConfig.twitterHandle,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.shortName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon`,
    description: siteConfig.description,
    sameAs: [],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/marketplace?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function carJsonLd(car: {
  id: string
  name: string
  brand: string
  model: string
  year: number
  description: string
  fuelType: string
  transmission: string
  seatingCapacity: number
  images?: { imageUrl: string }[]
  country?: { name: string }
  company?: { name: string }
}) {
  const image = car.images?.[0]?.imageUrl
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${car.brand} ${car.model} ${car.year}`,
    description: car.description,
    image: image ? [image] : undefined,
    brand: { '@type': 'Brand', name: car.brand },
    category: 'Vehicle Rental',
    url: `${siteConfig.url}/marketplace/cars/${car.id}`,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      seller: car.company
        ? { '@type': 'Organization', name: car.company.name }
        : undefined,
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Fuel Type', value: car.fuelType },
      { '@type': 'PropertyValue', name: 'Transmission', value: car.transmission },
      { '@type': 'PropertyValue', name: 'Seating Capacity', value: String(car.seatingCapacity) },
      { '@type': 'PropertyValue', name: 'Year', value: String(car.year) },
      ...(car.country ? [{ '@type': 'PropertyValue', name: 'Country', value: car.country.name }] : []),
    ],
  }
}

export function companyJsonLd(company: {
  id: string
  name: string
  businessAddress?: string
  whatsAppNumber?: string
  averageRating?: number
  totalReviews?: number
  country?: { name: string }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: company.name,
    url: `${siteConfig.url}/marketplace/companies/${company.id}`,
    address: company.businessAddress,
    telephone: company.whatsAppNumber,
    ...(company.averageRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: company.averageRating,
            reviewCount: company.totalReviews || 0,
          },
        }
      : {}),
    areaServed: company.country?.name,
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  }
}

import type { Metadata } from 'next'
import { getCompanyForMetadata } from '@/lib/data'
import { buildPageMetadata, companyJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import JsonLd from '@/components/seo/JsonLd'
import CompanyDetailClient from './CompanyDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const company = await getCompanyForMetadata(id)
    if (!company) {
      return buildPageMetadata({
        title: 'Company Profile',
        description: 'View car rental company profile on DriveHub Marketplace.',
        path: `/marketplace/companies/${id}`,
      })
    }

    const title = `${company.name} — Car Rental Company`
    const description = `Rent cars from ${company.name}${company.country?.name ? ` in ${company.country.name}` : ''}. Contact directly on WhatsApp.`

    return buildPageMetadata({
      title,
      description: description.slice(0, 160),
      path: `/marketplace/companies/${id}`,
      keywords: [company.name, 'car rental company', company.country?.name || ''].filter(Boolean),
    })
  } catch {
    return buildPageMetadata({
      title: 'Company Profile',
      description: 'View car rental company profile on DriveHub Marketplace.',
      path: `/marketplace/companies/${id}`,
    })
  }
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params
  let company = null
  try {
    company = await getCompanyForMetadata(id)
  } catch {
  }

  return (
    <>
      {company && (
        <JsonLd
          data={[
            companyJsonLd(company),
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Companies', path: '/marketplace/companies' },
              { name: company.name, path: `/marketplace/companies/${id}` },
            ]),
          ]}
        />
      )}
      <CompanyDetailClient id={id} />
    </>
  )
}

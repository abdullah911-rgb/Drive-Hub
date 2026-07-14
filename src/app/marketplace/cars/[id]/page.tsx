import type { Metadata } from 'next'
import { getCarForMetadata } from '@/lib/data'
import { buildPageMetadata, carJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import JsonLd from '@/components/seo/JsonLd'
import CarDetailClient from './CarDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const car = await getCarForMetadata(id)
    if (!car) {
      return buildPageMetadata({
        title: 'Vehicle Details',
        description: 'View car rental listing details on NextTripy Marketplace.',
        path: `/marketplace/cars/${id}`,
      })
    }

    const title = `Rent ${car.brand} ${car.model} ${car.year}`
    const description = car.description.slice(0, 160)
    const image = car.images?.[0]?.imageUrl

    return buildPageMetadata({
      title,
      description,
      path: `/marketplace/cars/${id}`,
      keywords: [car.brand, car.model, `${car.year} car rental`, car.fuelType, 'rent a car'],
      image,
    })
  } catch {
    return buildPageMetadata({
      title: 'Vehicle Details',
      description: 'View car rental listing details on NextTripy Marketplace.',
      path: `/marketplace/cars/${id}`,
    })
  }
}

export default async function CarDetailPage({ params }: PageProps) {
  const { id } = await params
  let car = null
  try {
    car = await getCarForMetadata(id)
  } catch {
  }

  return (
    <>
      {car && (
        <JsonLd
          data={[
            carJsonLd(car),
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Marketplace', path: '/marketplace' },
              { name: `${car.brand} ${car.model}`, path: `/marketplace/cars/${id}` },
            ]),
          ]}
        />
      )}
      <CarDetailClient id={id} />
    </>
  )
}

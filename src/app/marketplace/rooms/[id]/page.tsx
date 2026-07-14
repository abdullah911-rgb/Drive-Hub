import { Metadata } from 'next'
import RoomDetailClient from './RoomDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Room Details | NextTripy Hotels',
  description: 'View room details, amenities, and booking information.',
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { id } = await params
  return <RoomDetailClient id={id} />
}

import { Metadata } from 'next'
import HotelDashboardClient from './HotelDashboardClient'

export const metadata: Metadata = {
  title: 'Hotel Dashboard | NextTripy',
  description: 'Manage your hotel listings, rooms, and subscriptions.',
}

export default function HotelDashboardPage() {
  return <HotelDashboardClient />
}

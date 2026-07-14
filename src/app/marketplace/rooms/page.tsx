import { Metadata } from 'next'
import RoomsMarketplaceClient from './RoomsMarketplaceClient'

export const metadata: Metadata = {
  title: 'Hotels & Rooms | NextTripy',
  description: 'Find and book premium hotel rooms across the globe. Verified hotels with best-in-class accommodation.',
}

export default function RoomsMarketplacePage() {
  return <RoomsMarketplaceClient />
}

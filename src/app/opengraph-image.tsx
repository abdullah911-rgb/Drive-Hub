import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/seo'

export const alt = siteConfig.name
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #0C4A6E 100%)',
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: 'white',
            marginBottom: 20,
            letterSpacing: -2,
          }}
        >
          DriveHub
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#A5B4FC',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Global Car Rental Marketplace
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            color: '#94A3B8',
          }}
        >
          Browse • Compare • Rent via WhatsApp
        </div>
      </div>
    ),
    { ...size }
  )
}

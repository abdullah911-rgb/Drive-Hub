import { ImageResponse } from 'next/og'
import { AppIcon } from '@/lib/appIcon'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(<AppIcon size={192} />, { width: 192, height: 192 })
}

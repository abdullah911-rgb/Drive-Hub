import { ImageResponse } from 'next/og'
import { AppIcon } from '@/lib/appIcon'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(<AppIcon size={512} />, { width: 512, height: 512 })
}

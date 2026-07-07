'use client'
import Image from 'next/image'

const ALLOWED_HOSTS = new Set([
  'res.cloudinary.com',
  's3.amazonaws.com',
  'images.unsplash.com',
  'flagcdn.com',
])

function isAllowedImageUrl(src: string) {
  try {
    return ALLOWED_HOSTS.has(new URL(src).hostname)
  } catch {
    return false
  }
}

interface SafeImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  className?: string
}

export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  priority,
  sizes,
  className,
}: SafeImageProps) {
  if (!src || !isAllowedImageUrl(src)) {
    if (fill) {
      return <img src={src} alt={alt} className={className} loading={priority ? 'eager' : 'lazy'} />
    }
    return <img src={src} alt={alt} width={width} height={height} className={className} loading={priority ? 'eager' : 'lazy'} />
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={className}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 300}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  )
}

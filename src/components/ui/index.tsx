import { cn, getStatusColor } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: BadgeProps) {
  return (
    <span className={cn('badge', getStatusColor(status), className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {status}
    </span>
  )
}

interface RatingProps { rating: number; count?: number; size?: 'sm' | 'md' }
export function RatingStars({ rating, count, size = 'md' }: RatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {stars.map(star => (
          <svg key={star} className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4',
            star <= Math.round(rating) ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'
          )} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-amber-400 font-semibold text-sm">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-slate-500 text-xs">({count})</span>}
    </div>
  )
}

interface SkeletonProps { className?: string }
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />
}

export function CarCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  )
}

export function CompanyCardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  )
}

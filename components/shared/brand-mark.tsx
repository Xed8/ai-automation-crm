import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  compact?: boolean
  href?: string
}

export function BrandMark({ className, compact = false, href = '/' }: BrandMarkProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm text-white"
        style={{ background: 'var(--lp-accent)', fontFamily: 'var(--font-syne)' }}
      >
        L
      </div>
      <div className="flex flex-col leading-none">
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}
        >
          LeadFlow
        </span>
        {!compact && (
          <span className="mt-0.5 text-xs" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
            Pipeline control for modern agencies
          </span>
        )}
      </div>
    </div>
  )

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  )
}

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  compact?: boolean
  href?: string
}

export function BrandMark({ className, compact = false, href = '/' }: BrandMarkProps) {
  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="relative font-display text-sm font-bold">A</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          Agency CRM
        </span>
        {!compact && (
          <span className="mt-0.5 text-xs text-muted-foreground">
            Pipeline control for modern agency teams
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

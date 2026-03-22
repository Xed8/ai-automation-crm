import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
  won: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
  lost: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300',
  archived: 'bg-muted text-muted-foreground border-border',
}

export function LeadStatusBadge({ status }: { status: string }) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.archived
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
        styles,
      )}
    >
      {status}
    </span>
  )
}

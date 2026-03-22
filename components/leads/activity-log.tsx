'use client'

import { Button } from '@/components/ui/button'
import { usePagination } from '@/hooks/use-pagination'
import { fetchActivityPage } from '@/app/actions/crm'
import type { Tables } from '@/types/supabase'

type ActivityLog = Tables<'activity_logs'> & {
  user: { full_name: string | null } | null
}

interface ActivityLogProps {
  workspaceSlug: string
  leadId: string
  initialItems: ActivityLog[]
  initialCursor: string | null
}

export function ActivityLog({ workspaceSlug, leadId, initialItems, initialCursor }: ActivityLogProps) {
  const { items, hasMore, isPending, loadMore } = usePagination({
    initialItems,
    initialCursor,
    fetcher: (cursor) => fetchActivityPage(workspaceSlug, leadId, cursor),
  })

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Activity</h2>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        {items.map((activity) => (
          <div key={activity.id} className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
            <div>
              <div className="text-sm">
                <span className="font-medium">{activity.user?.full_name || 'System'}</span>{' '}
                <span className="text-muted-foreground">{activity.action_type.replace(/_/g, ' ')}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {new Date(activity.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-1">
            <Button variant="outline" size="sm" onClick={loadMore} disabled={isPending}>
              {isPending ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

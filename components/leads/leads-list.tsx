'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePagination } from '@/hooks/use-pagination'
import { fetchLeadsPage } from '@/app/actions/crm'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import type { Tables } from '@/types/supabase'

type Lead = Tables<'leads'> & {
  boards: { name: string } | null
  stages: { name: string } | null
}

interface LeadsListProps {
  workspaceSlug: string
  initialItems: Lead[]
  initialCursor: string | null
  q?: string
  status?: string
}

function getDaysSinceUpdated(updatedAt: string | null): number | null {
  if (!updatedAt) return null
  const now = new Date()
  const updated = new Date(updatedAt)
  return Math.floor((now.getTime() - updated.getTime()) / 86400000)
}

export function LeadsList({ workspaceSlug, initialItems, initialCursor, q, status }: LeadsListProps) {
  const { items, hasMore, isPending, loadMore } = usePagination({
    initialItems,
    initialCursor,
    fetcher: (cursor) => fetchLeadsPage(workspaceSlug, { cursor, q, status }),
  })

  const daysMap = useMemo(() => {
    const map = new Map<string, number | null>()
    items.forEach(lead => {
      map.set(lead.id, getDaysSinceUpdated(lead.updated_at))
    })
    return map
  }, [items])

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Firm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden md:table-cell">Pipeline</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden md:table-cell">Stage</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden lg:table-cell">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden lg:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden xl:table-cell">Updated</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((lead) => {
                const days = daysMap.get(lead.id)
                return (
                  <tr key={lead.id} className="group hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">
                      {lead.firm_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">
                      {lead.contact_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {lead.boards?.name || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="secondary" className="font-normal">
                        {lead.stages?.name || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground hidden lg:table-cell">
                      {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <LeadStatusBadge status={lead.status ?? 'active'} />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {days !== null && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          {days === 0 ? 'Today' : `${days}d ago`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/w/${workspaceSlug}/leads/${lead.id}`} aria-label={`Open ${lead.firm_name}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isPending}>
            {isPending ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}

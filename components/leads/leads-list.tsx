'use client'

import { useMemo, useState, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Clock, Check, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePagination } from '@/hooks/use-pagination'
import { fetchLeadsPage, bulkDeleteLeads } from '@/app/actions/crm'
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

function SortHeader({
  label,
  column,
  currentSortBy,
  currentSortOrder,
  className = '',
}: {
  label: string
  column: string
  currentSortBy: string | null
  currentSortOrder: 'asc' | 'desc'
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSort = () => {
    const newOrder = currentSortBy === column && currentSortOrder === 'desc' ? 'asc' : 'desc'
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', column)
    params.set('sortOrder', newOrder)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const isActive = currentSortBy === column

  return (
    <th className={`align-top ${className}`}>
      <button
        onClick={handleSort}
        className="flex items-center gap-1 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {label}
        {isActive ? (
          currentSortOrder === 'desc' ? (
            <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUp className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    </th>
  )
}

export function LeadsList({ workspaceSlug, initialItems, initialCursor, q, status }: LeadsListProps) {
  const searchParams = useSearchParams()
  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null
  const sortOrderValue = sortOrder || 'desc'

  const { items, hasMore, isPending, loadMore } = usePagination({
    initialItems,
    initialCursor,
    fetcher: (cursor) => fetchLeadsPage(workspaceSlug, { cursor, q, status, sortBy: sortBy || undefined, sortOrder: sortOrderValue }),
  })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, startDelete] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const daysMap = useMemo(() => {
    const map = new Map<string, number | null>()
    items.forEach(lead => {
      map.set(lead.id, getDaysSinceUpdated(lead.updated_at))
    })
    return map
  }, [items])

  const allSelected = useMemo(
    () => items.length > 0 && items.every((lead) => selectedIds.has(lead.id)),
    [items, selectedIds]
  )

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((lead) => lead.id)))
    }
  }, [allSelected, items])

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleBulkDelete = useCallback(() => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    const ids = Array.from(selectedIds)
    startDelete(async () => {
      const result = await bulkDeleteLeads(workspaceSlug, ids)
      if (result?.error) {
        toast.error(result.error)
      }
      setSelectedIds(new Set())
      setConfirming(false)
    })
  }, [confirming, selectedIds, workspaceSlug])

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
          <Check className="h-4 w-4 text-primary" />
          <span>{selectedIds.size} selected</span>
          {confirming ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                className="ml-auto h-7"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Deleting…</> : 'Confirm delete'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-muted-foreground"
                onClick={() => setConfirming(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-destructive hover:text-destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      )}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-2 py-3 w-10 align-top">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                </th>
                <SortHeader label="Firm" column="firm_name" currentSortBy={sortBy} currentSortOrder={sortOrderValue} className="align-top" />
                <SortHeader label="Contact" column="contact_name" currentSortBy={sortBy} currentSortOrder={sortOrderValue} className="align-top" />
                <SortHeader label="Pipeline" column="board" currentSortBy={sortBy} currentSortOrder={sortOrderValue} className="hidden md:table-cell align-top" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden md:table-cell align-top">Stage</th>
                <SortHeader label="Value" column="value" currentSortBy={sortBy} currentSortOrder={sortOrderValue} className="hidden lg:table-cell align-top" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden lg:table-cell align-top">Status</th>
                <SortHeader label="Updated" column="updated_at" currentSortBy={sortBy} currentSortOrder={sortOrderValue} className="hidden xl:table-cell align-top" />
                <th className="px-4 py-3 w-10 align-top" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((lead) => {
                const days = daysMap.get(lead.id)
                const isSelected = selectedIds.has(lead.id)
                return (
                  <tr key={lead.id} className={`group hover:bg-muted/40 transition-colors ${isSelected ? 'bg-muted/30' : ''}`}>
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(lead.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </td>
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

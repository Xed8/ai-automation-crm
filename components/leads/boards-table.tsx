'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Clock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { usePagination } from '@/hooks/use-pagination'
import { fetchBoardsPage } from '@/app/actions/crm'
import { DeleteBoardButton } from '@/components/leads/delete-board-button'
import type { Tables } from '@/types/supabase'

type Board = Tables<'boards'>

interface BoardsTableProps {
  workspaceSlug: string
  initialItems: Board[]
  initialCursor: string | null
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
    <button
      onClick={handleSort}
      className={`flex items-center gap-1 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors ${className}`}
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
  )
}

export function BoardsTable({ workspaceSlug, initialItems, initialCursor }: BoardsTableProps) {
  const searchParams = useSearchParams()
  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null

  const { items, hasMore, isPending, loadMore } = usePagination({
    initialItems,
    initialCursor,
    fetcher: (cursor) => fetchBoardsPage(workspaceSlug, { cursor, sortBy: sortBy || undefined, sortOrder: sortOrder || 'desc' }),
  })

  const sortOrderValue = sortOrder || 'desc'

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allSelected = useMemo(
    () => items.length > 0 && items.every((board) => selectedIds.has(board.id)),
    [items, selectedIds]
  )

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((board) => board.id)))
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

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
          <Check className="h-4 w-4 text-primary" />
          <span>{selectedIds.size} selected</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-muted-foreground">
            Bulk action (coming soon)
          </Button>
        </div>
      )}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-2 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                </th>
                <SortHeader label="Name" column="name" currentSortBy={sortBy} currentSortOrder={sortOrderValue} />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Description</th>
                <SortHeader label="Created" column="created_at" currentSortBy={sortBy} currentSortOrder={sortOrderValue} />
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((board) => {
                const isSelected = selectedIds.has(board.id)
                return (
                  <tr key={board.id} className={`group hover:bg-muted/40 transition-colors ${isSelected ? 'bg-muted/30' : ''}`}>
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(board.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {board.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[300px] truncate">
                      {board.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {board.created_at && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          {new Date(board.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Link href={`/w/${workspaceSlug}/boards/${board.id}`} aria-label={`Open ${board.name}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteBoardButton
                          workspaceSlug={workspaceSlug}
                          boardId={board.id}
                          boardName={board.name}
                        />
                      </div>
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

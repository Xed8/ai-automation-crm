'use client'

import { useState, useTransition } from 'react'

interface PaginationOptions<T> {
  initialItems: T[]
  initialCursor: string | null
  fetcher: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>
}

export function usePagination<T>({ initialItems, initialCursor, fetcher }: PaginationOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [isPending, startTransition] = useTransition()

  const hasMore = cursor !== null

  function loadMore() {
    if (!hasMore || isPending) return
    startTransition(async () => {
      const result = await fetcher(cursor)
      setItems((prev) => [...prev, ...result.items])
      setCursor(result.nextCursor)
    })
  }

  return { items, hasMore, isPending, loadMore }
}

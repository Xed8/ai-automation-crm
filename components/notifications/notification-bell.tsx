'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { BellIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications'
import type { Tables } from '@/types/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

const supabase = createClient()
type Notification = Tables<'notifications'>

interface NotificationBellProps {
  workspaceSlug: string
  userId: string
  workspaceId: string
}

export function NotificationBell({ workspaceSlug, userId, workspaceId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const router = useRouter()

  const PAGE_SIZE = 20

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1)

      if (data) {
        const hasNextPage = data.length > PAGE_SIZE
        const items = hasNextPage ? data.slice(0, PAGE_SIZE) : data
        setNotifications(items)
        setHasMore(hasNextPage)
        setCursor(hasNextPage ? items[items.length - 1].created_at : null)
      }

      const unreads = data?.filter(n => !n.is_read)?.length || 0
      setUnreadCount(unreads)
    }

    fetchNotifications()

    // Realtime subscription (Phase 6 MVP robust update)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: RealtimePostgresInsertPayload<Notification>) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, PAGE_SIZE))
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, workspaceId])

  const handleNotificationClick = (notification: Notification) => {
    startTransition(async () => {
      if (!notification.is_read) {
        await markNotificationAsRead(workspaceSlug, notification.id)
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      if (notification.link) {
        router.push(notification.link)
      }
      setIsOpen(false)
    })
  }

  const handleLoadMore = () => {
    if (!hasMore || isPending || !cursor) return
    startTransition(async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .lt('created_at', cursor)
        .limit(PAGE_SIZE + 1)

      if (data) {
        const hasNextPage = data.length > PAGE_SIZE
        const items = hasNextPage ? data.slice(0, PAGE_SIZE) : data
        setNotifications(prev => [...prev, ...items])
        setHasMore(hasNextPage)
        setCursor(hasNextPage ? items[items.length - 1].created_at : null)
      }
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead(workspaceSlug)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-11 w-11 rounded-2xl border-border/70 bg-background/80"
        >
          <BellIcon className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[24rem] rounded-[1.75rem] border border-white/60 bg-popover/95 p-2 shadow-lift backdrop-blur-xl dark:border-white/10"
      >
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="p-0 font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary" onClick={handleMarkAllRead} disabled={isPending}>
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications.
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-1">
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={`flex flex-col items-start gap-1 rounded-2xl p-3 ${!n.is_read ? 'bg-secondary/65 font-medium' : 'text-muted-foreground'}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="text-sm line-clamp-1">{n.title}</span>
                    {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  {n.message && (
                    <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </DropdownMenuItem>
              ))}
              {hasMore && (
                <div className="px-1 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={(e) => { e.stopPropagation(); handleLoadMore() }}
                    disabled={isPending}
                  >
                    {isPending ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

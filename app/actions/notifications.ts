'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceScope } from '@/lib/workspace-context'

export async function getUnreadNotificationsCount(workspaceSlug: string): Promise<number> {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Failed to fetch unread count:', error)
    return 0
  }

  return count || 0
}

export async function markNotificationAsRead(workspaceSlug: string, notificationId: string) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to mark notification as read:', error)
    return { error: 'Failed' }
  }

  revalidatePath(`/w/${workspaceSlug}`)
  return { success: true }
}

export async function markAllNotificationsAsRead(workspaceSlug: string) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    return { error: 'Failed' }
  }

  revalidatePath(`/w/${workspaceSlug}`)
  return { success: true }
}

// Used by internal functions to spawn a notification (e.g. assigning a lead)
export async function createNotification(payload: {
  workspace_id: string
  user_id: string
  type: string
  title: string
  message?: string
  link?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').insert(payload)
  if (error) {
    console.error('Failed to create notification:', error)
  }
}

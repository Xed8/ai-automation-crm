'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireWorkspaceScope } from '@/lib/workspace-context'

export async function inviteTeamMember(workspaceSlug: string, formData: FormData) {
  const { workspace, role } = await requireWorkspaceScope(workspaceSlug)

  if (role === 'member') {
    return { error: 'Only owners and admins can invite members.' }
  }

  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  const inviteRole = (formData.get('role') as string | null)?.trim() ?? 'member'

  if (!email) return { error: 'Email is required.' }
  if (!['admin', 'member'].includes(inviteRole)) return { error: 'Invalid role.' }

  const admin = createAdminClient()

  // Check if user already exists
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find((u) => u.email === email)

  if (existingUser) {
    // User exists — add directly to workspace_members if not already there
    const { data: existing } = await admin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('user_id', existingUser.id)
      .single()

    if (existing) {
      return { error: 'This user is already a member of this workspace.' }
    }

    const { error } = await admin.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: existingUser.id,
      role: inviteRole as 'admin' | 'member',
    })

    if (error) {
      console.error('Failed to add member:', error)
      return { error: 'Failed to add member.' }
    }
  } else {
    // New user — send invite email via Supabase Auth
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { invited_to_workspace: workspace.id },
    })

    if (inviteError || !invited.user) {
      console.error('Failed to invite user:', inviteError)
      return { error: 'Failed to send invite email.' }
    }

    // Pre-insert workspace membership so it's ready when they sign up
    await admin.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: invited.user.id,
      role: inviteRole as 'admin' | 'member',
    })
  }

  revalidatePath(`/w/${workspaceSlug}/team`)
  return { success: true }
}

export async function removeTeamMember(workspaceSlug: string, memberId: string) {
  const { workspace, role, user } = await requireWorkspaceScope(workspaceSlug)

  if (role === 'member') {
    return { error: 'Only owners and admins can remove members.' }
  }

  // Prevent removing yourself
  if (memberId === user.id) {
    return { error: 'You cannot remove yourself from the workspace.' }
  }

  const admin = createAdminClient()

  // Prevent removing the owner
  const { data: target } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', memberId)
    .single()

  if (target?.role === 'owner') {
    return { error: 'The workspace owner cannot be removed.' }
  }

  const { error } = await admin
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspace.id)
    .eq('user_id', memberId)

  if (error) return { error: 'Failed to remove member.' }

  revalidatePath(`/w/${workspaceSlug}/team`)
  return { success: true }
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function requireWorkspaceScope(workspaceSlug: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', workspaceSlug)
    .single()

  if (wsError || !workspace) {
    redirect('/workspaces?message=Workspace not found or access denied')
  }

  const membershipClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : supabase

  const { data: membership, error: membershipError } = await membershipClient
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    redirect('/workspaces')
  }

  return {
    user,
    workspace,
    role: membership.role
  }
}

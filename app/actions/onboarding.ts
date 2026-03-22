'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceScope } from '@/lib/workspace-context'

export type OnboardingStep =
  | 'create_board'
  | 'add_lead'
  | 'connect_form'
  | 'create_automation'

export async function completeOnboardingStep(workspaceSlug: string, step: OnboardingStep) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('workspace_members')
    .select('onboarding_completed_steps')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  if (!member) return

  const current: string[] = member.onboarding_completed_steps ?? []
  if (current.includes(step)) return

  await supabase
    .from('workspace_members')
    .update({ onboarding_completed_steps: [...current, step] })
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)

  revalidatePath(`/w/${workspaceSlug}`, 'layout')
}

export async function dismissOnboarding(workspaceSlug: string) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createClient()

  await supabase
    .from('workspace_members')
    .update({ onboarding_dismissed: true })
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)

  revalidatePath(`/w/${workspaceSlug}`, 'layout')
}

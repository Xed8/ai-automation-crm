'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireWorkspaceScope } from '@/lib/workspace-context'

async function setSubscriptionTier(
  workspaceSlug: string,
  tier: 'free' | 'pro' | 'enterprise',
  requiredRoles: string[]
) {
  const { workspace, role } = await requireWorkspaceScope(workspaceSlug)

  if (!requiredRoles.includes(role)) {
    redirect(
      `/w/${workspaceSlug}/settings?tab=billing&status=error&message=${encodeURIComponent('Only workspace owners and admins can change the plan.')}`
    )
  }

  const supabase = createAdminClient()

  // upsert ensures the row is created if the trigger somehow missed it
  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      { workspace_id: workspace.id, tier, status: 'active' },
      { onConflict: 'workspace_id' }
    )

  return { error, workspaceId: workspace.id }
}

/**
 * Upgrades a workspace to the Pro plan.
 * In production this would create a Stripe Checkout session.
 * For MVP it upserts the subscription tier directly.
 */
export async function upgradeToProAction(workspaceSlug: string) {
  const { error } = await setSubscriptionTier(workspaceSlug, 'pro', ['owner', 'admin'])

  if (error) {
    redirect(
      `/w/${workspaceSlug}/settings?tab=billing&status=error&message=${encodeURIComponent('Could not upgrade plan. Please try again.')}`
    )
  }

  redirect(
    `/w/${workspaceSlug}/settings?tab=billing&status=success&message=${encodeURIComponent('Upgraded to Pro! Your limits have been increased.')}`
  )
}

/**
 * Downgrades a workspace back to the free plan.
 */
export async function downgradeToFreeAction(workspaceSlug: string) {
  const { error } = await setSubscriptionTier(workspaceSlug, 'free', ['owner', 'admin'])

  if (error) {
    redirect(
      `/w/${workspaceSlug}/settings?tab=billing&status=error&message=${encodeURIComponent('Could not change plan. Please try again.')}`
    )
  }

  redirect(
    `/w/${workspaceSlug}/settings?tab=billing&status=success&message=${encodeURIComponent('Downgraded to Free plan.')}`
  )
}

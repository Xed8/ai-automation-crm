import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { createAdminClient } from '@/lib/supabase/admin'

// Hardcoded Plan Limits for MVP
export const PLAN_LIMITS = {
  free: {
    max_workspaces: 3,
    max_leads_per_month: 50,
    max_ai_tokens_per_month: 10000,
  },
  pro: {
    max_workspaces: 10,
    max_leads_per_month: 999999, // practically unlimited
    max_ai_tokens_per_month: 500000,
  },
  enterprise: {
    max_workspaces: 999999, // practically unlimited
    max_leads_per_month: 999999,
    max_ai_tokens_per_month: 9999999,
  }
}

export type QuotaFeature = 'leads' | 'ai_tokens'

/**
 * Checks if a workspace has enough quota to perform an action.
 * Returns true if allowed, false if blocked.
 */
export async function checkQuota(workspaceId: string, feature: QuotaFeature, exactCost: number = 1): Promise<{ allowed: boolean, reason?: string }> {
  const supabase = createAdminClient()

  // 1. Get Subscription Tier
  const { data: sub } = await supabase.from('subscriptions').select('tier, status').eq('workspace_id', workspaceId).single()

  if (!sub) {
    // Subscription row missing — seed it as free so the workspace isn't permanently blocked
    await supabase
      .from('subscriptions')
      .upsert({ workspace_id: workspaceId, tier: 'free', status: 'active' }, { onConflict: 'workspace_id' })
    return { allowed: true } // allow the action; the free limits will apply next check
  }

  if (sub.status !== 'active') {
    return { allowed: false, reason: 'No active subscription found.' }
  }

  const tier = sub.tier as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free

  // 2. Get Current Cycle Usage
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1) // rough billing cycle start for MVP, should be actual cycle start
  currentMonthStart.setHours(0,0,0,0)
  const currentMonthISO = currentMonthStart.toISOString()

  // Ensure usage row exists first
  await ensureUsageRow(supabase, workspaceId, currentMonthISO)

  const { data: usage } = await supabase
    .from('usage_metrics')
    .select('leads_created, ai_tokens_used')
    .eq('workspace_id', workspaceId)
    .eq('billing_cycle_start', currentMonthISO)
    .single()

  if (!usage) return { allowed: false, reason: 'Could not fetch usage state.' }

  // 3. Evaluate
  if (feature === 'leads') {
    if (usage.leads_created + exactCost > limits.max_leads_per_month) {
      return { allowed: false, reason: 'Lead creation limit reached for your current plan.' }
    }
  }

  if (feature === 'ai_tokens') {
    if (usage.ai_tokens_used + exactCost > limits.max_ai_tokens_per_month) {
      return { allowed: false, reason: 'AI Token limit reached for your current plan.' }
    }
  }

  return { allowed: true }
}

/**
 * Checks if a user can create another workspace.
 * The effective plan is the highest tier across all workspaces the user owns.
 * Free  → 3 workspaces
 * Pro   → 10 workspaces
 * Enterprise → unlimited
 */
export async function checkWorkspaceLimit(userId: string): Promise<{ allowed: boolean, reason?: string, limit: number, current: number }> {
  const supabase = createAdminClient()

  // Count workspaces the user currently owns
  const { count: ownedCount } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'owner')

  const current = ownedCount ?? 0

  // Resolve the user's effective plan — highest tier among their owned workspaces
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('role', 'owner')

  const workspaceIds = memberships?.map((m) => m.workspace_id) ?? []

  let effectiveTier: keyof typeof PLAN_LIMITS = 'free'

  if (workspaceIds.length > 0) {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('tier')
      .in('workspace_id', workspaceIds)
      .eq('status', 'active')

    const tierRank: Record<string, number> = { free: 0, pro: 1, enterprise: 2 }
    for (const sub of subs ?? []) {
      const t = sub.tier as keyof typeof PLAN_LIMITS
      if ((tierRank[t] ?? 0) > (tierRank[effectiveTier] ?? 0)) {
        effectiveTier = t
      }
    }
  }

  const limits = PLAN_LIMITS[effectiveTier] || PLAN_LIMITS.free
  const limit = limits.max_workspaces

  if (current >= limit) {
    const displayLimit = limit === 999999 ? 'unlimited' : String(limit)
    return {
      allowed: false,
      reason: `Your plan allows up to ${displayLimit} workspaces. Upgrade to create more.`,
      limit,
      current,
    }
  }

  return { allowed: true, limit, current }
}

/**
 * Increments usage safely after a successful action.
 */
export async function recordUsage(workspaceId: string, feature: QuotaFeature, exactCost: number = 1) {
  const supabase = createAdminClient()

  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0,0,0,0)
  const currentMonthISO = currentMonthStart.toISOString()

  await ensureUsageRow(supabase, workspaceId, currentMonthISO)

  const { data: current } = await supabase
    .from('usage_metrics')
    .select('leads_created, ai_tokens_used')
    .eq('workspace_id', workspaceId)
    .eq('billing_cycle_start', currentMonthISO)
    .single()

  if (current) {
    const nextUsage =
      feature === 'leads'
        ? { leads_created: current.leads_created + exactCost }
        : { ai_tokens_used: current.ai_tokens_used + exactCost }

    await supabase
      .from('usage_metrics')
      .update(nextUsage)
      .eq('workspace_id', workspaceId)
      .eq('billing_cycle_start', currentMonthISO)
  }
}

/**
 * Returns current-month usage + plan limits for display (progress bars, banners).
 */
export async function getWorkspaceUsage(workspaceId: string) {
  const supabase = createAdminClient()

  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)
  const currentMonthISO = currentMonthStart.toISOString()

  const [{ data: sub }, { data: usage }] = await Promise.all([
    supabase.from('subscriptions').select('tier, status').eq('workspace_id', workspaceId).single(),
    supabase.from('usage_metrics').select('leads_created, ai_tokens_used')
      .eq('workspace_id', workspaceId).eq('billing_cycle_start', currentMonthISO).single(),
  ])

  const tier = ((sub?.tier ?? 'free') as keyof typeof PLAN_LIMITS)
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free

  return {
    tier,
    leads_created: usage?.leads_created ?? 0,
    ai_tokens_used: usage?.ai_tokens_used ?? 0,
    limits,
  }
}

async function ensureUsageRow(supabase: SupabaseClient<Database>, workspaceId: string, cycleStartISO: string) {
  const { data } = await supabase.from('usage_metrics').select('workspace_id').eq('workspace_id', workspaceId).eq('billing_cycle_start', cycleStartISO).single()
  if (!data) {
    await supabase.from('usage_metrics').insert({
      workspace_id: workspaceId,
      billing_cycle_start: cycleStartISO,
      leads_created: 0,
      ai_tokens_used: 0
    })
  }
}

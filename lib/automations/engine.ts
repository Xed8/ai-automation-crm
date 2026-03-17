import type { Json } from '@/types/supabase'
import { executeAction } from './actions'
import { isJsonObject } from '@/lib/json'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Core Automation Engine Entrypoint.
 * Called by Server Actions whenever an event occurs in the CRM.
 */
export async function evaluateAutomations(
  workspaceId: string,
  boardId: string,
  triggerType: 'lead_created' | 'stage_changed' | 'form_submitted',
  leadId: string,
  triggerPayload: Record<string, Json | undefined> = {}
) {
  const supabase = createAdminClient()

  try {
    // 1. Fetch all active rules for this event on this board
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('board_id', boardId)
      .eq('trigger_type', triggerType)
      .eq('is_active', true)

    if (rulesError || !rules || rules.length === 0) {
      return // No rules to evaluate
    }

    // 2. Evaluate each rule
    for (const rule of rules) {
      // Basic Condition Checking (e.g., if triggerType is stage_changed, does the config match the new stage?)
      let shouldRun = true;
      
      if (triggerType === 'stage_changed' && isJsonObject(rule.trigger_config)) {
        const targetStageId =
          typeof rule.trigger_config.target_stage_id === 'string'
            ? rule.trigger_config.target_stage_id
            : undefined
        const newStageId =
          typeof triggerPayload.new_stage_id === 'string'
            ? triggerPayload.new_stage_id
            : undefined

        if (targetStageId && newStageId !== targetStageId) {
          shouldRun = false;
        }
      }

      if (!shouldRun) continue;

      // 3. Anti-Loop Mechanism: Has this rule successfully run on this lead recently?
      // A safe debounce is 5 minutes to prevent infinite ping-pongs.
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { data: recentLogs } = await supabase
        .from('automation_logs')
        .select('id')
        .eq('rule_id', rule.id)
        .eq('lead_id', leadId)
        .eq('status', 'success')
        .gte('executed_at', fiveMinsAgo)
        .limit(1)

      if (recentLogs && recentLogs.length > 0) {
        console.warn(`[Automator] Rule ${rule.id} aborted on Lead ${leadId} to prevent looping.`)
        continue;
      }

      // 4. Execution
      try {
        const result = await executeAction(rule.action_type, {
          workspaceId,
          boardId,
          leadId,
          config: rule.action_config
        })

        // 5. Logging (Success vs Failure)
        await supabase.from('automation_logs').insert({
          workspace_id: workspaceId,
          rule_id: rule.id,
          lead_id: leadId,
          status: result.success ? 'success' : 'failed',
          error_message: result.error || null
        })

      } catch (error: unknown) {
        // Log catastrophic engine execution failure
        await supabase.from('automation_logs').insert({
          workspace_id: workspaceId,
          rule_id: rule.id,
          lead_id: leadId,
          status: 'failed',
          error_message:
            error instanceof Error
              ? error.message
              : 'Unknown catastrophic execution failure'
        })
      }
    }

  } catch (err) {
    console.error('Fatal Automator Engine crash:', err)
  }
}

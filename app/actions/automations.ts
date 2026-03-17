'use server'

import { revalidatePath } from 'next/cache'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'

export async function createAutomationRule(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const boardId = (formData.get('board_id') as string | null)?.trim() ?? ''
  const triggerType = (formData.get('trigger_type') as string | null)?.trim() ?? ''
  const actionType = (formData.get('action_type') as string | null)?.trim() ?? ''

  if (!name || !boardId || !triggerType || !actionType) {
    return { error: 'All fields are required.' }
  }

  const triggerConfig: Record<string, string> = {}
  if (triggerType === 'stage_changed') {
    const stageId = (formData.get('trigger_stage_id') as string | null)?.trim()
    if (stageId) triggerConfig.target_stage_id = stageId
  }

  const actionConfig: Record<string, string> = {}
  if (actionType === 'create_task') {
    const title = (formData.get('action_task_title') as string | null)?.trim()
    if (!title) return { error: 'Task title is required.' }
    actionConfig.task_title = title
  } else if (actionType === 'move_stage') {
    const stageId = (formData.get('action_stage_id') as string | null)?.trim()
    if (!stageId) return { error: 'Target stage is required.' }
    actionConfig.to_stage_id = stageId
  } else if (actionType === 'create_note') {
    const content = (formData.get('action_note_content') as string | null)?.trim()
    if (!content) return { error: 'Note content is required.' }
    actionConfig.content = content
  } else if (actionType === 'assign_owner') {
    const assigneeId = (formData.get('action_assignee_id') as string | null)?.trim()
    if (!assigneeId) return { error: 'Assignee is required.' }
    actionConfig.assignee_id = assigneeId
  }

  const { error } = await supabase.from('automation_rules').insert({
    workspace_id: workspace.id,
    board_id: boardId,
    name,
    trigger_type: triggerType,
    trigger_config: triggerConfig,
    action_type: actionType,
    action_config: actionConfig,
    is_active: true,
  })

  if (error) {
    console.error('Failed to create automation rule:', error)
    return { error: 'Failed to create rule.' }
  }

  revalidatePath(`/w/${workspaceSlug}/automations`)
  return { success: true }
}

export async function toggleAutomationRule(workspaceSlug: string, ruleId: string, isActive: boolean) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { error } = await supabase
    .from('automation_rules')
    .update({ is_active: isActive })
    .eq('id', ruleId)
    .eq('workspace_id', workspace.id)

  if (error) return { error: 'Failed to update rule.' }

  revalidatePath(`/w/${workspaceSlug}/automations`)
  return { success: true }
}

export async function deleteAutomationRule(workspaceSlug: string, ruleId: string) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', ruleId)
    .eq('workspace_id', workspace.id)

  if (error) return { error: 'Failed to delete rule.' }

  revalidatePath(`/w/${workspaceSlug}/automations`)
  return { success: true }
}

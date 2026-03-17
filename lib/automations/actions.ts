import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
import { isJsonObject } from '@/lib/json'
import { createAdminClient } from '@/lib/supabase/admin'

export type ActionPayload = {
  workspaceId: string
  boardId: string
  leadId: string
  config: Json
}

export async function executeAction(actionType: string, payload: ActionPayload): Promise<{ success: boolean, error?: string }> {
  const supabase = createAdminClient()
  
  try {
    switch (actionType) {
      case 'create_task':
        return await handleCreateTask(supabase, payload)
      case 'move_stage':
        return await handleMoveStage(supabase, payload)
      case 'create_note':
        return await handleCreateNote(supabase, payload)
      case 'assign_owner':
        return await handleAssignOwner(supabase, payload)
      default:
        return { success: false, error: `Unknown action type: ${actionType}` }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal action execution failure'

    console.error(`Automation Action Error [${actionType}]:`, error)
    return { success: false, error: message }
  }
}

// --- Action Handlers ---

async function handleCreateTask(supabase: SupabaseClient<Database>, { workspaceId, leadId, config }: ActionPayload) {
  const title =
    isJsonObject(config) && typeof config.task_title === 'string'
      ? config.task_title
      : 'Automated Task'
  const description =
    isJsonObject(config) && typeof config.description === 'string'
      ? config.description
      : 'System generated task.'
  
  const { error } = await supabase.from('tasks').insert({
    workspace_id: workspaceId,
    lead_id: leadId,
    title,
    description,
    is_completed: false
  })

  if (error) throw new Error(error.message)
  return { success: true }
}

async function handleMoveStage(supabase: SupabaseClient<Database>, { workspaceId, leadId, config }: ActionPayload) {
  const toStageId =
    isJsonObject(config) && typeof config.to_stage_id === 'string'
      ? config.to_stage_id
      : undefined

  if (!toStageId) throw new Error('config.to_stage_id is required for move_stage')

  const { error } = await supabase.from('leads').update({
    stage_id: toStageId,
    updated_at: new Date().toISOString()
  }).eq('id', leadId).eq('workspace_id', workspaceId)

  if (error) throw new Error(error.message)
  return { success: true }
}

async function handleCreateNote(supabase: SupabaseClient<Database>, { workspaceId, leadId, config }: ActionPayload) {
  const content =
    isJsonObject(config) && typeof config.content === 'string'
      ? config.content
      : undefined
  
  if (!content) throw new Error('config.content is required for create_note')

  const { data: author } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!author?.user_id) {
    throw new Error('No workspace member available to author the automation note')
  }

  const { error } = await supabase.from('notes').insert({
    workspace_id: workspaceId,
    lead_id: leadId,
    author_id: author.user_id,
    content: `System: ${content}`,
  })

  if (error) throw new Error(error.message)
  return { success: true }
}


async function handleAssignOwner(supabase: SupabaseClient<Database>, { workspaceId, leadId, config }: ActionPayload) {
  const assigneeId =
    isJsonObject(config) && typeof config.assignee_id === 'string'
      ? config.assignee_id
      : undefined

  if (!assigneeId) throw new Error('config.assignee_id is required for assign_owner')

  const { error } = await supabase.from('leads').update({
    assigned_to: assigneeId,
    updated_at: new Date().toISOString()
  }).eq('id', leadId).eq('workspace_id', workspaceId)

  if (error) throw new Error(error.message)

  // Phase 6: Insert assignment notification
  const { data: lead } = await supabase.from('leads').select('firm_name').eq('id', leadId).single()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()
  
  const { error: notificationError } = await supabase.from('notifications').insert({
    workspace_id: workspaceId,
    user_id: assigneeId,
    type: 'assigned',
    title: 'New Lead Assigned',
    message: `You have been assigned to ${lead?.firm_name || 'a new lead'}.`,
    link: workspace?.slug ? `/w/${workspace.slug}/leads/${leadId}` : null,
  })

  if (notificationError) {
    console.error('Failed to create assignment notification:', notificationError)
  }

  return { success: true }
}

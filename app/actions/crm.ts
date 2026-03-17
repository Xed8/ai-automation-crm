'use server'

import { revalidatePath } from 'next/cache'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { evaluateAutomations } from '@/lib/automations/engine'

const SAMPLE_STAGES = [
  'New Inquiry',
  'Contacted',
  'Qualification',
  'Meeting Scheduled',
  'Proposal Sent',
  'Closed Won',
  'Closed Lost',
]

export async function seedSamplePipeline(workspaceSlug: string) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({
      workspace_id: workspace.id,
      name: 'Sales Pipeline',
      description: 'Default sales pipeline — rename stages or add new ones to fit your process.',
    })
    .select()
    .single()

  if (boardError || !board) {
    console.error('Failed to seed board:', boardError)
    return { error: 'Failed to create sample pipeline.' }
  }

  const { error: stagesError } = await supabase.from('stages').insert(
    SAMPLE_STAGES.map((name, order) => ({
      workspace_id: workspace.id,
      board_id: board.id,
      name,
      order,
    }))
  )

  if (stagesError) {
    console.error('Failed to seed stages:', stagesError)
    return { error: 'Failed to create sample stages.' }
  }

  revalidatePath(`/w/${workspaceSlug}/boards`)
  revalidatePath(`/w/${workspaceSlug}`)
  return { success: true, boardId: board.id }
}

export async function createBoard(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!name) {
    return { error: 'Board name is required.' }
  }

  const { data: board, error } = await supabase
    .from('boards')
    .insert({ workspace_id: workspace.id, name, description })
    .select()
    .single()

  if (error || !board) {
    console.error('Failed to create board:', error)
    return { error: 'Failed to create board.' }
  }

  // Auto-seed default stages so the board is immediately usable
  await supabase.from('stages').insert(
    SAMPLE_STAGES.map((stageName, order) => ({
      workspace_id: workspace.id,
      board_id: board.id,
      name: stageName,
      order,
    }))
  )

  revalidatePath(`/w/${workspaceSlug}`)
  revalidatePath(`/w/${workspaceSlug}/boards`)
  return { success: true, boardId: board.id }
}

export async function createStage(workspaceSlug: string, boardId: string, formData: FormData) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const name = (formData.get('name') as string | null)?.trim() ?? ''

  if (!name) {
    return { error: 'Stage name is required.' }
  }

  const { data: existingStages, error: stageLookupError } = await supabase
    .from('stages')
    .select('order')
    .eq('workspace_id', workspace.id)
    .eq('board_id', boardId)
    .order('order', { ascending: false })
    .limit(1)

  if (stageLookupError) {
    console.error('Failed to inspect existing stages:', stageLookupError)
    return { error: 'Failed to determine stage order.' }
  }

  const order = (existingStages?.[0]?.order ?? -1) + 1

  const { error } = await supabase
    .from('stages')
    .insert({
      workspace_id: workspace.id,
      board_id: boardId,
      name,
      order,
    })

  if (error) {
    console.error('Failed to create stage:', error)
    return { error: 'Failed to create stage.' }
  }

  revalidatePath(`/w/${workspaceSlug}/boards/${boardId}`)
  revalidatePath(`/w/${workspaceSlug}/forms`)
  return { success: true }
}

export async function createLead(workspaceSlug: string, boardId: string, stageId: string, formData: FormData) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const firmName = formData.get('firmName') as string
  const contactName = formData.get('contactName') as string | null
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  const value = formData.get('value') ? parseFloat(formData.get('value') as string) : null

  // Phase 8: Quota Enforcement
  const { checkQuota, recordUsage } = await import('@/lib/billing/quotas')
  const quota = await checkQuota(workspace.id, 'leads', 1)
  
  if (!quota.allowed) {
    return { error: quota.reason || 'Upgrade required to create more leads.' }
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspace.id,
      board_id: boardId,
      stage_id: stageId,
      firm_name: firmName,
      contact_name: contactName,
      email,
      phone,
      value
    })
    .select()
    .single()

  if (error || !lead) {
    console.error('Failed to create lead:', error)
    return { error: 'Failed to create lead.' }
  }

  // Generate Activity Log
  await supabase.from('activity_logs').insert({
    workspace_id: workspace.id,
    lead_id: lead.id,
    user_id: user.id,
    action_type: 'created',
    metadata: { note: 'Lead was created.' }
  })

  // Phase 5: Trigger Automations asynchronously
  evaluateAutomations(workspace.id, boardId, 'lead_created', lead.id)

  // Phase 8: Increment Usage
  recordUsage(workspace.id, 'leads', 1).catch(console.error)

  revalidatePath(`/w/${workspaceSlug}/boards/${boardId}`)
  return { success: true }
}

export async function updateLeadStage(workspaceSlug: string, boardId: string, leadId: string, newStageId: string) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { error } = await supabase
    .from('leads')
    .update({ stage_id: newStageId })
    .eq('id', leadId)
    .eq('workspace_id', workspace.id)

  if (error) {
    console.error('Failed to update lead stage:', error)
    return { error: 'Failed to update lead stage.' }
  }

  // Generate Activity Log
  await supabase.from('activity_logs').insert({
    workspace_id: workspace.id,
    lead_id: leadId,
    user_id: user.id,
    action_type: 'stage_changed',
    metadata: { to_stage_id: newStageId }
  })

  revalidatePath(`/w/${workspaceSlug}/boards/${boardId}`)
  return { success: true }
}

export async function createTask(workspaceSlug: string, leadId: string, formData: FormData) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  if (!title) return { error: 'Task title is required.' }

  const rawDue = (formData.get('due_date') as string | null)?.trim() || null

  const { error } = await supabase.from('tasks').insert({
    workspace_id: workspace.id,
    lead_id: leadId,
    title,
    due_date: rawDue || null,
  })

  if (error) {
    console.error('Failed to create task:', error)
    return { error: 'Failed to create task.' }
  }

  revalidatePath(`/w/${workspaceSlug}/leads/${leadId}`)
  return { success: true }
}

export async function toggleTask(workspaceSlug: string, taskId: string, completed: boolean) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { data: task } = await supabase
    .from('tasks')
    .select('lead_id')
    .eq('id', taskId)
    .eq('workspace_id', workspace.id)
    .single()

  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: completed })
    .eq('id', taskId)
    .eq('workspace_id', workspace.id)

  if (error) {
    console.error('Failed to toggle task:', error)
    return { error: 'Failed to update task.' }
  }

  if (task?.lead_id) {
    revalidatePath(`/w/${workspaceSlug}/leads/${task.lead_id}`)
  }
  return { success: true }
}

export async function changeLeadStage(workspaceSlug: string, leadId: string, formData: FormData) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const stageId = (formData.get('stage_id') as string | null)?.trim() ?? ''
  if (!stageId) return { error: 'Stage is required.' }

  const { data: lead } = await supabase
    .from('leads')
    .select('board_id')
    .eq('id', leadId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!lead) return { error: 'Lead not found.' }

  const { error } = await supabase
    .from('leads')
    .update({ stage_id: stageId })
    .eq('id', leadId)
    .eq('workspace_id', workspace.id)

  if (error) {
    console.error('Failed to change lead stage:', error)
    return { error: 'Failed to change stage.' }
  }

  await supabase.from('activity_logs').insert({
    workspace_id: workspace.id,
    lead_id: leadId,
    user_id: user.id,
    action_type: 'stage_changed',
    metadata: { to_stage_id: stageId },
  })

  if (lead.board_id) {
    evaluateAutomations(workspace.id, lead.board_id, 'stage_changed', leadId, { new_stage_id: stageId })
  }

  revalidatePath(`/w/${workspaceSlug}/leads/${leadId}`)
  if (lead.board_id) revalidatePath(`/w/${workspaceSlug}/boards/${lead.board_id}`)
  return { success: true }
}

export async function updateLead(workspaceSlug: string, leadId: string, formData: FormData) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const firmName = (formData.get('firm_name') as string | null)?.trim() ?? ''
  if (!firmName) return { error: 'Firm name is required.' }

  const rawValue = formData.get('value') as string | null
  const value = rawValue && rawValue.trim() !== '' ? parseFloat(rawValue) : null

  const { error } = await supabase
    .from('leads')
    .update({
      firm_name: firmName,
      contact_name: (formData.get('contact_name') as string | null)?.trim() || null,
      email: (formData.get('email') as string | null)?.trim() || null,
      phone: (formData.get('phone') as string | null)?.trim() || null,
      value: value !== null && isNaN(value) ? null : value,
    })
    .eq('id', leadId)
    .eq('workspace_id', workspace.id)

  if (error) {
    console.error('Failed to update lead:', error)
    return { error: 'Failed to update lead.' }
  }

  revalidatePath(`/w/${workspaceSlug}/leads/${leadId}`)
  revalidatePath(`/w/${workspaceSlug}/leads`)
  return { success: true }
}

export async function archiveLead(workspaceSlug: string, leadId: string) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('board_id, status')
    .eq('id', leadId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!lead) return { error: 'Lead not found.' }

  const newStatus = lead.status === 'active' ? 'archived' : 'active'

  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus })
    .eq('id', leadId)
    .eq('workspace_id', workspace.id)

  if (error) return { error: 'Failed to update lead status.' }

  revalidatePath(`/w/${workspaceSlug}/leads/${leadId}`)
  revalidatePath(`/w/${workspaceSlug}/leads`)
  if (lead.board_id) revalidatePath(`/w/${workspaceSlug}/boards/${lead.board_id}`)
  return { success: true, newStatus }
}

export async function createTestLead(workspaceSlug: string) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { data: board } = await supabase
    .from('boards').select('id').eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true }).limit(1).single()

  if (!board) return { error: 'Create a board first.' }

  const { data: stage } = await supabase
    .from('stages').select('id').eq('board_id', board.id)
    .eq('workspace_id', workspace.id).order('order', { ascending: true }).limit(1).single()

  if (!stage) return { error: 'Add at least one stage to your pipeline first.' }

  const { checkQuota, recordUsage } = await import('@/lib/billing/quotas')
  const quota = await checkQuota(workspace.id, 'leads', 1)
  if (!quota.allowed) return { error: quota.reason || 'Lead limit reached.' }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspace.id,
      board_id: board.id,
      stage_id: stage.id,
      firm_name: 'Acme Corp (Test Lead)',
      contact_name: 'Jane Smith',
      email: 'jane@acme.com',
      phone: '+1 555-0100',
      value: 5000,
    })
    .select().single()

  if (error || !lead) return { error: 'Failed to create test lead.' }

  await supabase.from('activity_logs').insert({
    workspace_id: workspace.id,
    lead_id: lead.id,
    user_id: user.id,
    action_type: 'created',
    metadata: { note: 'Test lead created from dashboard.' },
  })

  recordUsage(workspace.id, 'leads', 1).catch(console.error)
  revalidatePath(`/w/${workspaceSlug}`)
  revalidatePath(`/w/${workspaceSlug}/leads`)
  revalidatePath(`/w/${workspaceSlug}/boards/${board.id}`)
  return { success: true, boardId: board.id, leadId: lead.id }
}

export async function renameStage(workspaceSlug: string, stageId: string, name: string) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Stage name cannot be empty.' }

  const { data: stage, error: fetchError } = await supabase
    .from('stages')
    .select('board_id')
    .eq('id', stageId)
    .eq('workspace_id', workspace.id)
    .single()

  if (fetchError || !stage) return { error: 'Stage not found.' }

  const { error } = await supabase
    .from('stages')
    .update({ name: trimmed })
    .eq('id', stageId)
    .eq('workspace_id', workspace.id)

  if (error) return { error: 'Failed to rename stage.' }

  revalidatePath(`/w/${workspaceSlug}/boards/${stage.board_id}`)
  return { success: true }
}

export async function deleteStage(workspaceSlug: string, stageId: string) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { data: stage, error: fetchError } = await supabase
    .from('stages')
    .select('board_id, order')
    .eq('id', stageId)
    .eq('workspace_id', workspace.id)
    .single()

  if (fetchError || !stage) return { error: 'Stage not found.' }

  // Find adjacent stage to receive any leads
  const { data: otherStages } = await supabase
    .from('stages')
    .select('id')
    .eq('board_id', stage.board_id)
    .eq('workspace_id', workspace.id)
    .neq('id', stageId)
    .order('order', { ascending: true })

  const { data: leadsInStage } = await supabase
    .from('leads')
    .select('id')
    .eq('stage_id', stageId)
    .eq('workspace_id', workspace.id)

  if (leadsInStage && leadsInStage.length > 0) {
    if (!otherStages || otherStages.length === 0) {
      return { error: 'Cannot delete the only stage. Add another stage first, then delete this one.' }
    }
    // Move all leads to the nearest other stage
    const { error: moveError } = await supabase
      .from('leads')
      .update({ stage_id: otherStages[0].id })
      .eq('stage_id', stageId)
      .eq('workspace_id', workspace.id)

    if (moveError) return { error: 'Failed to move leads out of stage.' }
  }

  const { error } = await supabase
    .from('stages')
    .delete()
    .eq('id', stageId)
    .eq('workspace_id', workspace.id)

  if (error) return { error: 'Failed to delete stage.' }

  revalidatePath(`/w/${workspaceSlug}/boards/${stage.board_id}`)
  revalidatePath(`/w/${workspaceSlug}/leads`)
  return { success: true, boardId: stage.board_id, movedCount: leadsInStage?.length ?? 0 }
}

export async function deleteBoard(workspaceSlug: string, boardId: string) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)
    .eq('workspace_id', workspace.id)

  if (error) {
    console.error('Failed to delete board:', error)
    return { error: 'Failed to delete board.' }
  }

  revalidatePath(`/w/${workspaceSlug}/boards`)
  revalidatePath(`/w/${workspaceSlug}`)
  return { success: true }
}

export async function createNote(workspaceSlug: string, leadId: string, formData: FormData) {
  const { workspace, user } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const content = formData.get('content') as string

  const { error } = await supabase
    .from('notes')
    .insert({
      workspace_id: workspace.id,
      lead_id: leadId,
      author_id: user.id,
      content
    })

  if (error) {
    console.error('Failed to create note:', error)
    return { error: 'Failed to create note.' }
  }

  // Generate Activity Log
  await supabase.from('activity_logs').insert({
    workspace_id: workspace.id,
    lead_id: leadId,
    user_id: user.id,
    action_type: 'note_added',
  })

  revalidatePath(`/w/${workspaceSlug}/leads/${leadId}`)
  return { success: true }
}

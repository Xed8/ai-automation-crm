'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { parseIngestLeadFromFormResult } from '@/lib/lead-intake'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { evaluateAutomations } from '@/lib/automations/engine'

export async function createLeadForm(workspaceSlug: string, formData: FormData) {
  const { workspace } = await requireWorkspaceScope(workspaceSlug)
  const supabase = await createPrivilegedServerClient()

  const name = formData.get('name') as string
  const boardId = formData.get('boardId') as string
  const stageId = formData.get('stageId') as string

  if (!name || !boardId || !stageId) {
    return { error: 'Missing required fields' }
  }

  const { error } = await supabase
    .from('lead_forms')
    .insert({
      workspace_id: workspace.id,
      name,
      board_id: boardId,
      stage_id: stageId
    })

  if (error) {
    console.error('Failed to create form:', error)
    return { error: 'Failed to create form.' }
  }

  revalidatePath(`/w/${workspaceSlug}/forms`)
  return { success: true }
}

export async function submitPublicForm(formId: string, formData: FormData) {
  const admin = createAdminClient()
  const firmName = formData.get('firmName') as string
  const contactName = formData.get('contactName') as string | null
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  const message = formData.get('message') as string | null

  if (!firmName) {
    return { error: 'Missing required configuration' }
  }

  const { data: form, error: formError } = await admin
    .from('lead_forms')
    .select('webhook_secret')
    .eq('id', formId)
    .eq('is_active', true)
    .single()

  if (formError || !form) {
    console.error('Failed to load public form configuration:', formError)
    return { error: 'Form not found or inactive.' }
  }

  const { data, error } = await admin.rpc('ingest_lead_from_form', {
    p_form_id: formId,
    p_webhook_secret: form.webhook_secret,
    p_firm_name: firmName,
    p_contact_name: contactName ?? '',
    p_email: email ?? '',
    p_phone: phone ?? '',
    p_message: message ?? ''
  })

  if (error) {
    console.error('Failed to submit public form (RPC error):', error)
    return { error: 'Technical error processing form' }
  }
  
  const result = parseIngestLeadFromFormResult(data)
  if (result?.success === false) {
    return { error: result.error || 'Form submission was rejected.' }
  }

  if (result?.status === 'created' && result.leadId) {
    const leadRes = await admin
      .from('leads')
      .select('workspace_id, board_id')
      .eq('id', result.leadId)
      .single()

    if (leadRes.data) {
      await evaluateAutomations(
        leadRes.data.workspace_id,
        leadRes.data.board_id,
        'form_submitted',
        result.leadId
      )
    } else if (leadRes.error) {
      console.error('Failed to load lead context for automation evaluation:', leadRes.error)
    }
  }

  return { success: true }
}

'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'

function integrationRedirect(workspaceSlug: string, status: 'success' | 'error', message: string) {
  const encodedMessage = encodeURIComponent(message)
  redirect(`/w/${workspaceSlug}/settings?tab=integrations&status=${status}&message=${encodedMessage}`)
}

export async function createOutboundWebhook(workspaceSlug: string, formData: FormData) {
  const { workspace, role } = await requireWorkspaceScope(workspaceSlug)

  if (role === 'member') {
    integrationRedirect(workspaceSlug, 'error', 'Only admins can manage webhooks.')
  }

  const endpointUrl = (formData.get('endpointUrl') as string | null)?.trim() ?? ''
  const eventType = (formData.get('eventType') as string | null)?.trim() ?? ''
  const providedSecret = (formData.get('secret') as string | null)?.trim() ?? ''
  const secret = providedSecret || randomBytes(24).toString('hex')

  if (!endpointUrl || !eventType) {
    integrationRedirect(workspaceSlug, 'error', 'Event type and endpoint URL are required.')
  }

  try {
    const parsedUrl = new URL(endpointUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      integrationRedirect(workspaceSlug, 'error', 'Webhook URL must start with http:// or https://.')
    }
  } catch {
    integrationRedirect(workspaceSlug, 'error', 'Please enter a valid webhook URL.')
  }

  const supabase = await createPrivilegedServerClient()
  const { error } = await supabase.from('outbound_webhooks').insert({
    workspace_id: workspace.id,
    event_type: eventType,
    endpoint_url: endpointUrl,
    secret,
  })

  if (error) {
    console.error('Failed to create outbound webhook:', error)
    integrationRedirect(workspaceSlug, 'error', 'Could not save webhook.')
  }

  revalidatePath(`/w/${workspaceSlug}/settings`)
  integrationRedirect(workspaceSlug, 'success', 'Webhook saved.')
}

export async function deleteOutboundWebhook(workspaceSlug: string, formData: FormData) {
  const { role } = await requireWorkspaceScope(workspaceSlug)

  if (role === 'member') {
    integrationRedirect(workspaceSlug, 'error', 'Only admins can manage webhooks.')
  }

  const webhookId = (formData.get('webhookId') as string | null)?.trim() ?? ''
  if (!webhookId) {
    integrationRedirect(workspaceSlug, 'error', 'Missing webhook id.')
  }

  const supabase = await createPrivilegedServerClient()
  const { error } = await supabase.from('outbound_webhooks').delete().eq('id', webhookId)

  if (error) {
    console.error('Failed to delete outbound webhook:', error)
    integrationRedirect(workspaceSlug, 'error', 'Could not delete webhook.')
  }

  revalidatePath(`/w/${workspaceSlug}/settings`)
  integrationRedirect(workspaceSlug, 'success', 'Webhook removed.')
}

export async function sendInboundWebhookTest(workspaceSlug: string, formData: FormData) {
  const { workspace, role } = await requireWorkspaceScope(workspaceSlug)

  if (role === 'member') {
    integrationRedirect(workspaceSlug, 'error', 'Only admins can send test webhook requests.')
  }

  const formId = (formData.get('formId') as string | null)?.trim() ?? ''
  const baseUrl = (formData.get('baseUrl') as string | null)?.trim() ?? ''

  if (!formId || !baseUrl) {
    integrationRedirect(workspaceSlug, 'error', 'Missing form test configuration.')
  }

  const admin = createAdminClient()
  const { data: form, error: formError } = await admin
    .from('lead_forms')
    .select('id, name, webhook_secret')
    .eq('id', formId)
    .eq('workspace_id', workspace.id)
    .single()

  if (formError || !form) {
    console.error('Failed to load form for webhook test:', formError)
    integrationRedirect(workspaceSlug, 'error', 'Could not load form credentials for test.')
  }

  const loadedForm = form!

  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/webhooks/intake`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loadedForm.webhook_secret}`,
    },
    body: JSON.stringify({
      formId: loadedForm.id,
      firmName: `Test Lead ${new Date().toLocaleTimeString()}`,
      contactName: 'Dashboard Integration Test',
      email: 'testlead@example.com',
      phone: '+15550001111',
      message: `Triggered from settings for ${loadedForm.name}.`,
    }),
  }).catch((error: unknown) => {
    console.error('Failed to reach intake webhook route:', error)
    return null
  })

  if (!response) {
    integrationRedirect(workspaceSlug, 'error', 'Could not reach the webhook endpoint.')
  }

  const resolvedResponse = response!

  if (!resolvedResponse.ok) {
    let detail = ''

    try {
      const payload = await resolvedResponse.json() as { error?: string }
      detail = payload.error ? ` ${payload.error}` : ''
    } catch {
      detail = ''
    }

    integrationRedirect(workspaceSlug, 'error', `Test request failed with ${resolvedResponse.status}.${detail}`)
  }

  revalidatePath(`/w/${workspaceSlug}/settings`)
  revalidatePath(`/w/${workspaceSlug}/leads`)
  integrationRedirect(workspaceSlug, 'success', `Test lead sent through ${loadedForm.name}.`)
}

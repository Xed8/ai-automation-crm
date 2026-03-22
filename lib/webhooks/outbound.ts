import { createHmac } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/supabase'

export type OutboundEventType =
  | 'lead.created'
  | 'lead.stage_changed'
  | 'lead.assigned'
  | 'form.submitted'

/**
 * Fires all active outbound webhooks registered for the given event type in
 * the workspace. Each request is:
 *   - signed with HMAC-SHA256 over the raw JSON body using the stored secret
 *   - sent asynchronously (does not block the caller — fire and forget)
 *   - logged to outbound_webhook_logs regardless of success or failure
 *
 * Safe to call without awaiting.
 */
export function emitOutboundWebhook(
  workspaceId: string,
  eventType: OutboundEventType,
  payload: Record<string, unknown>
): void {
  // Intentionally not awaited — background fire-and-forget
  _emit(workspaceId, eventType, payload).catch((err) => {
    console.error('[OutboundWebhook] Unhandled emit error:', err)
  })
}

async function _emit(
  workspaceId: string,
  eventType: OutboundEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient()

  // Load all active webhooks for this workspace + event type
  const { data: webhooks, error } = await supabase
    .from('outbound_webhooks')
    .select('id, endpoint_url, secret')
    .eq('workspace_id', workspaceId)
    .eq('event_type', eventType)
    .eq('is_active', true)

  if (error) {
    console.error('[OutboundWebhook] Failed to load webhooks:', error)
    return
  }

  if (!webhooks || webhooks.length === 0) return

  const body = JSON.stringify({ event: eventType, workspace_id: workspaceId, ...payload })
  const timestamp = Date.now().toString()

  await Promise.allSettled(
    webhooks.map((webhook) => _deliver(supabase, webhook, eventType, workspaceId, body, timestamp, payload))
  )
}

async function _deliver(
  supabase: ReturnType<typeof createAdminClient>,
  webhook: { id: string; endpoint_url: string; secret: string | null },
  eventType: OutboundEventType,
  workspaceId: string,
  body: string,
  timestamp: string,
  payload: Record<string, unknown>
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-LeadFlow-Event': eventType,
    'X-LeadFlow-Timestamp': timestamp,
  }

  // HMAC-SHA256 signature over "<timestamp>.<body>" using the stored secret.
  // Recipients can verify: HMAC-SHA256(secret, `${timestamp}.${rawBody}`)
  if (webhook.secret) {
    const sig = createHmac('sha256', webhook.secret)
      .update(`${timestamp}.${body}`)
      .digest('hex')
    headers['X-LeadFlow-Signature'] = `sha256=${sig}`
  }

  let httpStatus: number | null = null
  let success = false
  let errorMessage: string | null = null

  try {
    const response = await fetch(webhook.endpoint_url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000), // 10 s hard timeout
    })

    httpStatus = response.status
    success = response.ok

    if (!response.ok) {
      errorMessage = `HTTP ${response.status}`
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown fetch error'
  }

  // Log delivery attempt — best-effort, never throws
  await supabase
    .from('outbound_webhook_logs')
    .insert({
      webhook_id: webhook.id,
      workspace_id: workspaceId,
      event_type: eventType,
      payload: payload as Json,
      http_status: httpStatus,
      success,
      error_message: errorMessage,
    })
    .then(({ error: logError }) => {
      if (logError) console.error('[OutboundWebhook] Failed to write log:', logError)
    })
}

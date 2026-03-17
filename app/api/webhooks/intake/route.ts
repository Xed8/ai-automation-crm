import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { isJsonObject } from '@/lib/json'
import { parseIngestLeadFromFormResult } from '@/lib/lead-intake'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateAutomations } from '@/lib/automations/engine'

// Webhooks don't have cookies or standard auth, so we just use a generic anon client
// and let the SECURITY DEFINER RPC handle the secret validation.
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or malformed Authorization header' }, { status: 401 })
    }

    const webhookSecret = authHeader.split(' ')[1]
    const body = await req.json()
    if (!isJsonObject(body)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Required arguments from incoming webhook payload
    const formId = typeof body.formId === 'string' ? body.formId : null
    const firmName = typeof body.firmName === 'string' ? body.firmName : null
    const contactName = typeof body.contactName === 'string' ? body.contactName : null
    const email = typeof body.email === 'string' ? body.email : null
    const phone = typeof body.phone === 'string' ? body.phone : null
    const message = typeof body.message === 'string' ? body.message : null

    if (!formId || !firmName) {
      return NextResponse.json({ error: 'formId and firmName are required' }, { status: 400 })
    }

    // Call the SECURITY DEFINER function
    const { data, error } = await supabase.rpc('ingest_lead_from_form', {
      p_form_id: formId,
      p_webhook_secret: webhookSecret,
      p_firm_name: firmName,
      p_contact_name: contactName ?? '',
      p_email: email ?? '',
      p_phone: phone ?? '',
      p_message: message ?? ''
    })

    if (error) {
      console.error('Webhook RPC Error:', error)
      return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 })
    }

    const result = parseIngestLeadFromFormResult(data)
    if (result?.success === false) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    // Trigger automations after intake succeeds. This must use a privileged client
    // because the webhook request itself is anonymous.
    if (result?.status === 'created' && result.leadId) {
      const leadId = result.leadId
      const admin = createAdminClient()
      const leadRes = await admin
        .from('leads')
        .select('workspace_id, board_id')
        .eq('id', leadId)
        .single()

      if (leadRes.data) {
        await evaluateAutomations(leadRes.data.workspace_id, leadRes.data.board_id, 'form_submitted', leadId)
      } else if (leadRes.error) {
        console.error('Failed to load lead context for automation evaluation:', leadRes.error)
      }
    }

    return NextResponse.json({ success: true, result }, { status: 201 })
    
  } catch (err: unknown) {
    console.error('Webhook Generic Error:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

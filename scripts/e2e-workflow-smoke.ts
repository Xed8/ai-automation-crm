import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { evaluateAutomations } from '@/lib/automations/engine'

function loadEnv(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const env: Record<string, string> = {}

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }

  return env
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const env = loadEnv(path.join(process.cwd(), '.env.local'))
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const now = Date.now()
  const email = `e2e.workflow.${now}@gmail.com`
  const password = 'E2EFlow123!'
  const workspaceId = crypto.randomUUID()
  const boardId = crypto.randomUUID()
  const stageId = crypto.randomUUID()
  const slug = `workflow-${now}`

  const createdUser = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'E2E Workflow User' },
  })

  if (createdUser.error) {
    throw new Error(`CREATE_USER_ERROR: ${createdUser.error.message}`)
  }

  const userId = createdUser.data.user.id

  const cleanup = async () => {
    await admin.from('workspaces').delete().eq('id', workspaceId)
    await admin.auth.admin.deleteUser(userId)
  }

  try {
    const workspace = await admin
      .from('workspaces')
      .insert({ id: workspaceId, name: 'Workflow Smoke Workspace', slug })
    if (workspace.error) throw new Error(`WORKSPACE_ERROR: ${workspace.error.message}`)

    const membership = await admin
      .from('workspace_members')
      .insert({ workspace_id: workspaceId, user_id: userId, role: 'owner' })
    if (membership.error) throw new Error(`MEMBERSHIP_ERROR: ${membership.error.message}`)

    const board = await admin
      .from('boards')
      .insert({
        id: boardId,
        workspace_id: workspaceId,
        name: 'Inbound Pipeline',
        description: 'End-to-end smoke test board',
      })
    if (board.error) throw new Error(`BOARD_ERROR: ${board.error.message}`)

    const stage = await admin
      .from('stages')
      .insert({
        id: stageId,
        workspace_id: workspaceId,
        board_id: boardId,
        name: 'New Lead',
        order: 0,
      })
    if (stage.error) throw new Error(`STAGE_ERROR: ${stage.error.message}`)

    const formInsert = await admin
      .from('lead_forms')
      .insert({
        workspace_id: workspaceId,
        board_id: boardId,
        stage_id: stageId,
        name: 'Website Intake',
      })
      .select('id, webhook_secret')
      .single()
    if (formInsert.error) throw new Error(`FORM_ERROR: ${formInsert.error.message}`)

    const taskRule = await admin.from('automation_rules').insert({
      workspace_id: workspaceId,
      board_id: boardId,
      name: 'Create follow-up task',
      description: 'Smoke test rule',
      trigger_type: 'form_submitted',
      trigger_config: {},
      action_type: 'create_task',
      action_config: {
        task_title: 'Call lead within 15 minutes',
        description: 'Created by workflow smoke test',
      },
      is_active: true,
    })
    if (taskRule.error) throw new Error(`TASK_RULE_ERROR: ${taskRule.error.message}`)

    const noteRule = await admin.from('automation_rules').insert({
      workspace_id: workspaceId,
      board_id: boardId,
      name: 'Create automation note',
      description: 'Smoke test rule',
      trigger_type: 'form_submitted',
      trigger_config: {},
      action_type: 'create_note',
      action_config: {
        content: 'Lead submitted through the public form.',
      },
      is_active: true,
    })
    if (noteRule.error) throw new Error(`NOTE_RULE_ERROR: ${noteRule.error.message}`)

    let webhookStatus: number | null = null
    let webhookBody: unknown = null

    try {
      const response = await fetch('http://localhost:3000/api/webhooks/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${formInsert.data.webhook_secret}`,
        },
        body: JSON.stringify({
          formId: formInsert.data.id,
          firmName: 'Acme Logistics',
          contactName: 'Jordan Flow',
          email: 'jordan.flow@example.com',
          phone: '+15551234567',
          message: 'Interested in automation and CRM setup',
        }),
      })

      webhookStatus = response.status
      webhookBody = await response.json()
    } catch (error) {
      webhookBody = {
        error: error instanceof Error ? error.message : 'Webhook route unreachable',
      }
    }

    await sleep(1500)

    const leads = await admin
      .from('leads')
      .select('id, firm_name, contact_name, email, board_id, stage_id, status, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (leads.error) throw new Error(`LEADS_QUERY_ERROR: ${leads.error.message}`)
    const lead = leads.data[0]
    if (!lead) throw new Error('LEAD_NOT_CREATED')

    let tasks = await admin
      .from('tasks')
      .select('title, description, lead_id')
      .eq('workspace_id', workspaceId)
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })

    let notes = await admin
      .from('notes')
      .select('content, lead_id')
      .eq('workspace_id', workspaceId)
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })

    let automationLogs = await admin
      .from('automation_logs')
      .select('rule_id, status, lead_id, error_message')
      .eq('workspace_id', workspaceId)
      .eq('lead_id', lead.id)
      .order('executed_at', { ascending: false })

    const routeTriggeredAutomation =
      (tasks.data?.length ?? 0) > 0 ||
      (notes.data?.length ?? 0) > 0 ||
      (automationLogs.data?.length ?? 0) > 0

    if (!routeTriggeredAutomation) {
      await evaluateAutomations(workspaceId, boardId, 'form_submitted', lead.id)

      tasks = await admin
        .from('tasks')
        .select('title, description, lead_id')
        .eq('workspace_id', workspaceId)
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })

      notes = await admin
        .from('notes')
        .select('content, lead_id')
        .eq('workspace_id', workspaceId)
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })

      automationLogs = await admin
        .from('automation_logs')
        .select('rule_id, status, lead_id, error_message')
        .eq('workspace_id', workspaceId)
        .eq('lead_id', lead.id)
        .order('executed_at', { ascending: false })
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          user: { email, userId },
          workspace: { workspaceId, slug },
          board: { boardId, stageId },
          webhook: {
            status: webhookStatus,
            body: webhookBody,
            routeTriggeredAutomation,
          },
          lead,
          tasks: tasks.data,
          notes: notes.data,
          automationLogs: automationLogs.data,
        },
        null,
        2
      )
    )
  } finally {
    await cleanup()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})

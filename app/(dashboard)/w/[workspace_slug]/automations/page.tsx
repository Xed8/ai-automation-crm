import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { toggleAutomationRule, deleteAutomationRule } from '@/app/actions/automations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RuleBuilder } from '@/components/automations/rule-builder'

type Json = Record<string, unknown>

function getTriggerLabel(triggerType: string, triggerConfig: Json, stageMap: Map<string, string>) {
  if (triggerType === 'lead_created') return 'Lead is created'
  if (triggerType === 'form_submitted') return 'Form is submitted'
  if (triggerType === 'stage_changed') {
    const stageId = typeof triggerConfig?.target_stage_id === 'string' ? triggerConfig.target_stage_id : null
    const stageName = stageId ? stageMap.get(stageId) : null
    return stageName ? `Lead moves to "${stageName}"` : 'Lead moves to a stage'
  }
  return triggerType
}

function getActionLabel(actionType: string, actionConfig: Json, stageMap: Map<string, string>, memberMap: Map<string, string>) {
  if (actionType === 'create_task') {
    const title = typeof actionConfig?.task_title === 'string' ? actionConfig.task_title : 'a task'
    return `Create task: "${title}"`
  }
  if (actionType === 'move_stage') {
    const stageId = typeof actionConfig?.to_stage_id === 'string' ? actionConfig.to_stage_id : null
    const stageName = stageId ? stageMap.get(stageId) : null
    return `Move lead to "${stageName ?? 'stage'}"`
  }
  if (actionType === 'create_note') return 'Add a note to the lead'
  if (actionType === 'assign_owner') {
    const memberId = typeof actionConfig?.assignee_id === 'string' ? actionConfig.assignee_id : null
    const memberName = memberId ? memberMap.get(memberId) : null
    return `Assign to ${memberName ?? 'team member'}`
  }
  return actionType
}

export default async function AutomationsPage({
  params,
}: {
  params: Promise<{ workspace_slug: string }>
}) {
  const { workspace_slug } = await params
  const { workspace } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()

  const [{ data: boards }, { data: members }, { data: rules }] = await Promise.all([
    supabase
      .from('boards')
      .select('id, name, stages(id, name, order)')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('workspace_members')
      .select('user_id, profiles(full_name)')
      .eq('workspace_id', workspace.id),
    supabase
      .from('automation_rules')
      .select('*, boards(name)')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false }),
  ])

  // Build lookup maps for display
  const stageMap = new Map<string, string>()
  boards?.forEach((b) => {
    const stages = b.stages as { id: string; name: string }[] | null
    stages?.forEach((s) => stageMap.set(s.id, s.name))
  })

  const memberMap = new Map<string, string>()
  members?.forEach((m) => {
    const profile = m.profiles as { full_name?: string } | null
    if (profile?.full_name) memberMap.set(m.user_id, profile.full_name)
  })

  // Normalise boards for RuleBuilder
  const builderBoards = (boards ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    stages: ((b.stages as { id: string; name: string; order: number }[] | null) ?? [])
      .sort((a, z) => a.order - z.order),
  }))

  const builderMembers = (members ?? []).map((m) => ({
    user_id: m.user_id,
    full_name: (m.profiles as { full_name?: string } | null)?.full_name ?? 'Unknown',
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="space-y-3">
          <span className="eyebrow">
            <Zap className="h-3.5 w-3.5" />
            Automations
          </span>
          <div>
            <h2 className="text-4xl font-semibold sm:text-5xl">Rules that run themselves.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Set a trigger and an action — the engine handles the rest every time it fires.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="surface-card rounded-lg px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active rules</div>
            <div className="mt-3 text-3xl font-semibold">
              {rules?.filter((r) => r.is_active).length ?? 0}
            </div>
          </div>
          <div className="surface-card rounded-lg px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total rules</div>
            <div className="mt-3 text-3xl font-semibold">{rules?.length ?? 0}</div>
          </div>
          <div className="surface-card rounded-lg px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Available actions</div>
            <div className="mt-3 text-3xl font-semibold">4</div>
          </div>
        </div>
      </section>

      {/* Create rule */}
      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Create automation rule</CardTitle>
          <CardDescription>
            Pick a pipeline, set a trigger, then choose what happens automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(boards ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create a board first before setting up automation rules.
            </p>
          ) : (
            <RuleBuilder
              boards={builderBoards}
              members={builderMembers}
              workspaceSlug={workspace_slug}
            />
          )}
        </CardContent>
      </Card>

      {/* Rules list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Your rules
        </h3>

        {(!rules || rules.length === 0) ? (
          <Card className="surface-card p-8 text-center">
            <CardHeader>
              <CardTitle className="text-xl">No rules yet</CardTitle>
              <CardDescription>
                Create your first rule above to start automating your pipeline.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-3">
            {rules.map((rule) => {
              const triggerConfig = (rule.trigger_config ?? {}) as Json
              const actionConfig = (rule.action_config ?? {}) as Json
              const boardName = (rule.boards as { name?: string } | null)?.name ?? 'Unknown board'
              const triggerLabel = getTriggerLabel(rule.trigger_type, triggerConfig, stageMap)
              const actionLabel = getActionLabel(rule.action_type, actionConfig, stageMap, memberMap)

              return (
                <div
                  key={rule.id}
                  className="surface-card flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{boardName}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                        {triggerLabel}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {actionLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {/* Toggle active */}
                    <form
                      action={async () => {
                        'use server'
                        await toggleAutomationRule(workspace_slug, rule.id, !rule.is_active)
                      }}
                    >
                      <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                        {rule.is_active ? 'Pause' : 'Activate'}
                      </Button>
                    </form>

                    {/* Delete */}
                    <form
                      action={async () => {
                        'use server'
                        const result = await deleteAutomationRule(workspace_slug, rule.id)
                        if (result?.error) {
                          redirect(`/w/${workspace_slug}/automations?error=${encodeURIComponent(result.error)}`)
                        }
                      }}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { fetchActivityPage } from '@/app/actions/crm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AIActions } from '@/components/leads/ai-actions'
import { TaskList } from '@/components/leads/task-list'
import { ActivityLog } from '@/components/leads/activity-log'
import { LeadHeader, EditLeadForm, MoveStageForm, AddNoteForm } from '@/components/leads/lead-detail-forms'

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ workspace_slug: string; lead_id: string }>
}) {
  const { workspace_slug, lead_id } = await params
  const { workspace } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(`*, boards(name), stages(name), assigned_to(full_name)`)
    .eq('id', lead_id)
    .eq('workspace_id', workspace.id)
    .single()

  if (leadError || !lead) {
    return <div className="p-6 text-destructive">Lead not found.</div>
  }

  const { data: boardStages } = await supabase
    .from('stages')
    .select('id, name, order')
    .eq('board_id', lead.board_id!)
    .eq('workspace_id', workspace.id)
    .order('order', { ascending: true })

  const { data: notes } = await supabase
    .from('notes')
    .select('*, author:profiles(full_name)')
    .eq('lead_id', lead.id)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url)')
    .eq('lead_id', lead.id)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, profiles(id, full_name, avatar_url)')
    .eq('workspace_id', workspace.id)

  const { items: activities, nextCursor: activityCursor } = await fetchActivityPage(workspace_slug, lead_id, null)

  const boardName = (lead.boards?.name as string) || 'Unassigned'
  const stageName = (lead.stages?.name as string) || 'No stage'
  const assignedTo = (lead.assigned_to as { full_name?: string } | null)?.full_name || 'Unassigned'

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

      {/* Left column */}
      <div className="space-y-6">
        <section className="surface-panel px-5 py-5">
          <LeadHeader
            workspaceSlug={workspace_slug}
            lead={lead}
          />
          <p className="mt-1.5 text-sm text-muted-foreground">{boardName} / {stageName}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="surface-card px-4 py-3">
              <div className="eyebrow">Contact</div>
              <div className="mt-2 text-sm font-semibold">{lead.contact_name || '—'}</div>
            </div>
            <div className="surface-card px-4 py-3">
              <div className="eyebrow">Value</div>
              <div className="mt-2 text-sm font-semibold text-primary">
                {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="surface-card px-4 py-3">
              <div className="eyebrow">Assigned to</div>
              <div className="mt-2 text-sm font-semibold">{assignedTo}</div>
            </div>
          </div>
        </section>

        {/* Edit lead form */}
        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Edit lead</CardTitle>
          </CardHeader>
          <CardContent>
            <EditLeadForm workspaceSlug={workspace_slug} lead={lead} />
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="surface-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Contact info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="font-medium">{lead.contact_name || '—'}</div>
              <div className="font-mono text-muted-foreground">{lead.email || 'No email'}</div>
              <div className="font-mono text-muted-foreground">{lead.phone || 'No phone'}</div>
            </CardContent>
          </Card>
          <Card className="surface-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Pipeline context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[['Status', lead.status], ['Pipeline', boardName], ['Stage', stageName]].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <ActivityLog
          workspaceSlug={workspace_slug}
          leadId={lead_id}
          initialItems={activities}
          initialCursor={activityCursor}
        />
      </div>

      {/* Right column */}
      <div className="space-y-5">

        {/* Move stage */}
        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Move stage</CardTitle>
          </CardHeader>
          <CardContent>
            <MoveStageForm
              workspaceSlug={workspace_slug}
              leadId={lead_id}
              currentStageId={lead.stage_id}
              stages={boardStages ?? []}
            />
          </CardContent>
        </Card>

        {/* AI assist */}
        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">AI assist</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <AIActions workspaceSlug={workspace_slug} leadId={lead_id} />
          </CardContent>
        </Card>

        {/* Tasks */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Tasks</h3>
          <TaskList
            tasks={tasks ?? []}
            workspaceSlug={workspace_slug}
            leadId={lead_id}
            members={(members ?? []).flatMap(m => {
              const p = m.profiles as unknown as { id: string; full_name: string | null; avatar_url: string | null } | null
              return p ? [p] : []
            })}
          />
        </div>

        {/* Notes */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Notes</h3>
          <div className="space-y-2">
            <AddNoteForm workspaceSlug={workspace_slug} leadId={lead_id} />
            {notes?.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
            {notes?.map((note) => (
              <div key={note.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {note.author?.full_name} &middot; {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

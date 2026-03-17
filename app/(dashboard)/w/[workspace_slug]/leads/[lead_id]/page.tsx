import { redirect } from 'next/navigation'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { createNote, changeLeadStage, updateLead, archiveLead } from '@/app/actions/crm'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AIActions } from '@/components/leads/ai-actions'
import { TaskList } from '@/components/leads/task-list'

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
    .select('*')
    .eq('lead_id', lead.id)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  const { data: activities } = await supabase
    .from('activity_logs')
    .select('*, user:profiles(full_name)')
    .eq('lead_id', lead.id)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const boardName = (lead.boards?.name as string) || 'Unassigned'
  const stageName = (lead.stages?.name as string) || 'No stage'
  const assignedTo = (lead.assigned_to as { full_name?: string } | null)?.full_name || 'Unassigned'
  const isArchived = lead.status === 'archived'

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

      {/* Left column */}
      <div className="space-y-6">
        <section className="surface-panel px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">{lead.firm_name}</h1>
              <Badge variant={lead.status === 'active' ? 'default' : 'secondary'}>{lead.status}</Badge>
            </div>
            {/* Archive / restore button */}
            <form action={async () => {
              'use server'
              const result = await archiveLead(workspace_slug, lead_id)
              if (result?.error) {
                redirect(`/w/${workspace_slug}/leads/${lead_id}?error=${encodeURIComponent(result.error)}`)
              }
            }}>
              <Button type="submit" variant="outline" size="sm" className="text-muted-foreground">
                {isArchived ? 'Restore lead' : 'Archive lead'}
              </Button>
            </form>
          </div>
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
            <form
              action={async (formData) => {
                'use server'
                const result = await updateLead(workspace_slug, lead_id, formData)
                if (result?.error) {
                  redirect(`/w/${workspace_slug}/leads/${lead_id}?error=${encodeURIComponent(result.error)}`)
                }
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="firm_name" className="text-xs">Firm name *</Label>
                <Input id="firm_name" name="firm_name" defaultValue={lead.firm_name} required className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_name" className="text-xs">Contact name</Label>
                <Input id="contact_name" name="contact_name" defaultValue={lead.contact_name ?? ''} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={lead.email ?? ''} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Phone</Label>
                <Input id="phone" name="phone" defaultValue={lead.phone ?? ''} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="value" className="text-xs">Deal value ($)</Label>
                <Input id="value" name="value" type="number" min="0" step="0.01" defaultValue={lead.value ?? ''} className="h-8 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="sm" className="w-full sm:w-auto">Save changes</Button>
              </div>
            </form>
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

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Activity</h2>
          <div className="space-y-2">
            {activities?.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {activities?.map((activity) => (
              <div key={activity.id} className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                <div>
                  <div className="text-sm">
                    <span className="font-medium">{activity.user?.full_name || 'System'}</span>{' '}
                    <span className="text-muted-foreground">{activity.action_type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-5">

        {/* Move stage */}
        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Move stage</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                'use server'
                const result = await changeLeadStage(workspace_slug, lead_id, formData)
                if (result?.error) {
                  redirect(`/w/${workspace_slug}/leads/${lead_id}?error=${encodeURIComponent(result.error)}`)
                }
              }}
              className="flex gap-2"
            >
              <select
                name="stage_id"
                defaultValue={lead.stage_id ?? ''}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {boardStages?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <Button type="submit" size="sm" className="h-9">Move</Button>
            </form>
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
          <TaskList tasks={tasks ?? []} workspaceSlug={workspace_slug} leadId={lead_id} />
        </div>

        {/* Notes */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Notes</h3>
          <div className="space-y-2">
            <form
              className="space-y-2"
              action={async (formData) => {
                'use server'
                const content = (formData.get('content') as string | null)?.trim() ?? ''
                if (!content) return
                const result = await createNote(workspace_slug, lead_id, formData)
                if (result?.error) {
                  redirect(`/w/${workspace_slug}/leads/${lead_id}?error=${encodeURIComponent(result.error)}`)
                }
              }}
            >
              <Textarea name="content" placeholder="Write a note…" rows={3} required className="resize-none text-sm" />
              <Button type="submit" size="sm" className="w-full">Add note</Button>
            </form>
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

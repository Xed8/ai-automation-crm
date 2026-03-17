import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createStage } from '@/app/actions/crm'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KanbanBoard } from '@/components/leads/kanban-board'
import { DeleteBoardButton } from '@/components/leads/delete-board-button'


export default async function BoardPipelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace_slug: string, board_id: string }>;
  searchParams: Promise<{ message?: string; status?: string }>;
}) {
  const { workspace_slug, board_id } = await params
  const { message, status } = await searchParams
  const { workspace } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', board_id)
    .eq('workspace_id', workspace.id)
    .single()

  if (boardError || !board) {
    return <div className="p-6 text-destructive">Board not found or access denied.</div>
  }

  const { data: stages, error: stagesError } = await supabase
    .from('stages')
    .select('*')
    .eq('board_id', board.id)
    .eq('workspace_id', workspace.id)
    .order('order', { ascending: true })

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('board_id', board.id)
    .eq('workspace_id', workspace.id)
    .eq('status', 'active')

  if (stagesError || leadsError) {
    return <div className="p-6 text-destructive">Failed to load pipeline data.</div>
  }

  const messageClassName =
    status === 'success'
      ? 'rounded-[1.25rem] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200'
      : 'rounded-[1.25rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'

  return (
    <div className="flex h-full flex-col space-y-4">
      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Board detail</span>
            <div>
              <h1 className="text-4xl font-semibold sm:text-5xl">{board.name}</h1>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Default stages are pre-loaded — rename, add, or remove them to match your process, then create an intake form.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/w/${workspace_slug}/forms`}>Go to forms</Link>
            </Button>
            <DeleteBoardButton
              workspaceSlug={workspace_slug}
              boardId={board_id}
              boardName={board.name}
              redirectAfter
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Stages</div>
            <div className="mt-3 text-3xl font-semibold">{stages?.length ?? 0}</div>
          </div>
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active leads</div>
            <div className="mt-3 text-3xl font-semibold">{leads?.length ?? 0}</div>
          </div>
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Next step</div>
            <div className="mt-3 text-sm font-semibold">
              {stages?.length ? 'Create an intake form to start capturing leads' : 'Add a stage to get started'}
            </div>
          </div>
        </div>
      </section>

      {message ? <div className={messageClassName}>{message}</div> : null}

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Add stage</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 xl:grid-cols-[1fr_auto]"
            action={async (formData) => {
              'use server'

              const result = await createStage(workspace_slug, board_id, formData)

              if (result?.error) {
                redirect(`/w/${workspace_slug}/boards/${board_id}?status=error&message=${encodeURIComponent(result.error)}`)
              }

              redirect(`/w/${workspace_slug}/boards/${board_id}?status=success&message=${encodeURIComponent('Stage created. You can now build an intake form.')}`)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Stage name</Label>
              <Input id="name" name="name" placeholder="New inquiry" required />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full justify-between xl:w-auto">
                Add stage
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-x-auto">
        <KanbanBoard
          stages={stages ?? []}
          leads={leads ?? []}
          workspaceSlug={workspace_slug}
          boardId={board_id}
        />
      </div>
    </div>
  )
}

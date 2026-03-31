export const revalidate = 60

import { KanbanSquare, Layers3, Sparkles } from 'lucide-react'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { fetchBoardsPage } from '@/app/actions/crm'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateBoardForm } from '@/components/leads/create-board-form'
import { SamplePipelineButton } from '@/components/leads/sample-pipeline-button'
import { BoardsTable } from '@/components/leads/boards-table'

export default async function BoardsIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace_slug: string }>;
  searchParams: Promise<{ message?: string; status?: string; sortBy?: string; sortOrder?: string }>;
}) {
  const { workspace_slug } = await params
  const { message, status, sortBy, sortOrder } = await searchParams
  const { workspace } = await requireWorkspaceScope(workspace_slug)

  const { items: boards, nextCursor } = await fetchBoardsPage(workspace_slug, { 
    cursor: null, 
    sortBy, 
    sortOrder: sortOrder as 'asc' | 'desc' | undefined 
  })

  const messageClassName =
    status === 'success'
      ? 'rounded-[1.25rem] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200'
      : 'rounded-[1.25rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'

  return (
    <div className="space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Boards</span>
            <div>
              <h2 className="text-4xl font-semibold sm:text-5xl">Pipeline boards at a glance.</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Step 1: create a board for {workspace.name}, then add stages, then create the intake form.
              </p>
            </div>
          </div>
          {boards.length === 0 && (
            <div className="rounded-[1.25rem] border border-border/70 bg-background/65 px-4 py-3 text-sm text-muted-foreground">
              Create your first board to unlock stages and forms.
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Boards</span>
              <KanbanSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-semibold">{boards.length}{nextCursor ? '+' : ''}</div>
          </div>
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Structure</span>
              <Layers3 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-sm font-semibold">Board {'->'} stages {'->'} intake form {'->'} integrations</div>
          </div>
        </div>
      </section>

      {message ? <div className={messageClassName}>{message}</div> : null}

      <CreateBoardForm workspaceSlug={workspace_slug} />

      {boards.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle>Start from scratch</CardTitle>
              <CardDescription>
                Fill in the form above to create a custom board, then open it to add stages.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="surface-card border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Recommended</span>
              </div>
              <CardTitle>Load sample pipeline</CardTitle>
              <CardDescription>
                Creates a ready-made <strong>Sales Pipeline</strong> with 7 stages: New Lead → Initial Contact → Discovery Call → Proposal Sent → Negotiation → Closed Won → Closed Lost. Rename or delete any stage after loading.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <SamplePipelineButton workspaceSlug={workspace_slug} />
            </CardFooter>
          </Card>
        </div>
      ) : (
        <BoardsTable
          workspaceSlug={workspace_slug}
          initialItems={boards}
          initialCursor={nextCursor}
        />
      )}
    </div>
  )
}

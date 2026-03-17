import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, KanbanSquare, Layers3, Plus, Sparkles } from 'lucide-react'
import { createBoard, seedSamplePipeline } from '@/app/actions/crm'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeleteBoardButton } from '@/components/leads/delete-board-button'

export default async function BoardsIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace_slug: string }>;
  searchParams: Promise<{ message?: string; status?: string }>;
}) {
  const { workspace_slug } = await params
  const { message, status } = await searchParams
  const { workspace } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()

  const { data: boards, error } = await supabase
    .from('boards')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-6 text-destructive">Failed to load boards</div>
  }

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
          <div className="rounded-[1.25rem] border border-border/70 bg-background/65 px-4 py-3 text-sm text-muted-foreground">
            Create your first board to unlock stages and forms.
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="surface-card rounded-[1.5rem] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Boards</span>
              <KanbanSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-semibold">{boards.length}</div>
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

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Create board</CardTitle>
          <CardDescription>
            Start here. After creating a board, open it and add at least one stage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 xl:grid-cols-[1fr_1.3fr_auto]"
            action={async (formData) => {
              'use server'

              const result = await createBoard(workspace_slug, formData)

              if (result?.error) {
                redirect(`/w/${workspace_slug}/boards?status=error&message=${encodeURIComponent(result.error)}`)
              }

              redirect(`/w/${workspace_slug}/boards/${result.boardId}`)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Board name</Label>
              <Input id="name" name="name" placeholder="Inbound Sales Pipeline" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Track website and outbound opportunities." />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full justify-between xl:w-auto">
                Create board
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
              <form
                className="w-full"
                action={async () => {
                  'use server'
                  const result = await seedSamplePipeline(workspace_slug)
                  if (result?.error) {
                    redirect(`/w/${workspace_slug}/boards?status=error&message=${encodeURIComponent(result.error)}`)
                  }
                  redirect(`/w/${workspace_slug}/boards/${result.boardId}`)
                }}
              >
                <Button type="submit" className="w-full justify-between">
                  Load sample pipeline
                  <Sparkles className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card key={board.id} className="surface-card surface-card-hover">
              <CardHeader>
                <CardTitle className="text-2xl">{board.name}</CardTitle>
                <CardDescription className="mt-2">
                  {board.description || 'No description provided'}
                </CardDescription>
                <div className="mt-4 rounded-[1.25rem] bg-secondary/70 px-4 py-4 text-sm text-muted-foreground">
                  Created {board.created_at ? new Date(board.created_at).toLocaleDateString() : 'recently'}.
                  Open this board next to add stages.
                </div>
              </CardHeader>
              <CardFooter className="gap-2">
                <Button asChild className="flex-1 justify-between">
                  <Link href={`/w/${workspace.slug}/boards/${board.id}`}>
                    Open board
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <DeleteBoardButton
                  workspaceSlug={workspace_slug}
                  boardId={board.id}
                  boardName={board.name}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

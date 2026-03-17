import Link from 'next/link'
import { ArrowRight, Building2, Clock3, Layers3, Plus, Sparkles, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { checkWorkspaceLimit } from '@/lib/billing/quotas'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeleteWorkspaceButton } from '@/components/shared/delete-workspace-button'

function formatWorkspaceDate(value: string | null) {
  if (!value) {
    return 'Recently created'
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function WorkspacesListPage() {
  const supabase = await createClient()

  const [{ data: workspaces, error }, { data: { user } }] = await Promise.all([
    supabase.from('workspaces').select('*').order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  if (error) {
    return <div className="text-destructive">Failed to load workspaces</div>
  }

  const workspaceCount = workspaces.length
  const latestWorkspace = workspaces[0] ?? null
  const quota = user ? await checkWorkspaceLimit(user.id) : null
  const usagePct = quota ? Math.round((quota.current / quota.limit) * 100) : 0
  const showQuotaBanner = quota && !quota.allowed

  return (
    <div className="space-y-5">
      {showQuotaBanner && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>
              You&apos;ve used <strong>{quota.current}</strong> / {quota.limit} workspaces on your current plan.
              Upgrade to Pro to create up to 10.
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 h-7 text-xs">
            <Link href="/workspaces/create">Upgrade to Pro →</Link>
          </Button>
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="surface-panel hero-grid relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
          <CardContent className="relative p-6 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="eyebrow w-fit">
                  <Sparkles className="h-3.5 w-3.5" />
                  Overview
                </span>
                <div className="space-y-2">
                  <h2 className="max-w-3xl text-3xl font-semibold sm:text-4xl">
                    Choose where you want to work today.
                  </h2>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    The dashboard is trimmed down so the workspace list stays front and center.
                  </p>
                </div>
              </div>

              <Button asChild size="lg" className="w-full lg:w-auto">
                <Link href="/workspaces/create">
                  <Plus className="h-4 w-4" />
                  New workspace
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/60 px-4 py-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  <Layers3 className="h-4 w-4 text-primary" />
                  Workspaces
                </div>
                <div className="mt-3 text-3xl font-semibold">{workspaceCount}</div>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-background/60 px-4 py-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  <Clock3 className="h-4 w-4 text-primary" />
                  Newest
                </div>
                <div className="mt-3 text-lg font-semibold">
                  {latestWorkspace ? latestWorkspace.name : 'No workspace yet'}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-background/60 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Next step</div>
                <div className="mt-3 text-lg font-semibold">
                  {workspaceCount === 0 ? 'Create your first workspace' : 'Open an active workspace'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl">Important</CardTitle>
            <CardDescription>
              {workspaceCount === 0
                ? 'You need one workspace before the CRM can be used.'
                : `${latestWorkspace?.name ?? 'Your latest workspace'} is ready to open.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-[1.35rem] bg-background/70 px-4 py-4">
              {workspaceCount === 0
                ? 'Start with one workspace for one client or team.'
                : 'Use separate workspaces for different clients, teams, or experiments.'}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full justify-between">
              <Link href={workspaceCount === 0 ? '/workspaces/create' : `/w/${latestWorkspace?.slug}`}>
                {workspaceCount === 0 ? 'Create workspace' : 'Open latest workspace'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold sm:text-3xl">Workspace directory</h3>
            <p className="text-sm text-muted-foreground">Open a workspace or create a new one.</p>
          </div>
        </div>

        {workspaceCount === 0 ? (
          <Card className="surface-card p-4 text-center sm:p-8">
            <CardHeader>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="mt-3 text-3xl">No workspaces yet</CardTitle>
              <CardDescription className="mx-auto max-w-xl text-base">
                Create your first workspace to get into the CRM.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild size="lg">
                <Link href="/workspaces/create">Create a workspace</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {workspaces.map((workspace) => (
              <Card key={workspace.id} className="surface-card surface-card-hover">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{workspace.name}</CardTitle>
                      <CardDescription>/{workspace.slug}</CardDescription>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Ready
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.35rem] bg-secondary/70 px-4 py-4 text-sm">
                      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Created</div>
                      <div className="mt-2 font-semibold text-foreground">
                        {formatWorkspaceDate(workspace.created_at)}
                      </div>
                    </div>
                    <div className="rounded-[1.35rem] bg-secondary/70 px-4 py-4 text-sm">
                      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Path</div>
                      <div className="mt-2 font-semibold text-foreground">/w/{workspace.slug}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardFooter className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="w-full justify-between sm:flex-1">
                    <Link href={`/w/${workspace.slug}`}>
                      Open workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DeleteWorkspaceButton
                    workspaceSlug={workspace.slug}
                    workspaceName={workspace.name}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

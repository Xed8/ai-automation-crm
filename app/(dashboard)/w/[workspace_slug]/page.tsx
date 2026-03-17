import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  FileInput,
  FlaskConical,
  KanbanSquare,
  Settings2,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { createTestLead } from '@/app/actions/crm'

type PriorityCard = {
  tone: 'warning' | 'success'
  eyebrow: string
  title: string
  body: string
  href: string
  cta: string
}

export default async function WorkspaceIndexPage({
  params,
}: {
  params: Promise<{ workspace_slug: string }>;
}) {
  const { workspace_slug } = await params
  const { workspace } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()

  const todayISO = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const [
    { count: leadCount },
    { count: boardCount },
    { count: formCount },
    { data: dueTasks },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('boards').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('lead_forms').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase
      .from('tasks')
      .select('id, title, due_date, leads(firm_name)')
      .eq('workspace_id', workspace.id)
      .eq('is_completed', false)
      .lte('due_date', todayISO)
      .order('due_date', { ascending: true })
      .limit(5),
  ])

  const setupComplete = Number((boardCount ?? 0) > 0) + Number((formCount ?? 0) > 0) + Number((leadCount ?? 0) > 0)

  let priority: PriorityCard

  if ((boardCount ?? 0) === 0) {
    priority = {
      tone: 'warning',
      eyebrow: 'Important',
      title: 'Create your first pipeline',
      body: 'Set up a board before your team starts moving leads.',
      href: `/w/${workspace_slug}/boards`,
      cta: 'Open boards',
    }
  } else if ((formCount ?? 0) === 0) {
    priority = {
      tone: 'warning',
      eyebrow: 'Important',
      title: 'Add a form',
      body: 'Give this workspace a place for new leads to enter.',
      href: `/w/${workspace_slug}/forms`,
      cta: 'Open forms',
    }
  } else if ((leadCount ?? 0) === 0) {
    priority = {
      tone: 'warning',
      eyebrow: 'Almost there',
      title: 'Send a test lead',
      body: 'Your setup is ready. Create a test lead with one click to confirm the full pipeline works.',
      href: `/w/${workspace_slug}/leads`,
      cta: 'Open leads',
    }
  } else {
    priority = {
      tone: 'success',
      eyebrow: 'Ready',
      title: 'Workspace is live',
      body: 'Boards, forms, and leads are all active.',
      href: `/w/${workspace_slug}/leads`,
      cta: 'Go to leads',
    }
  }

  const metrics = [
    {
      label: 'Leads',
      value: leadCount ?? 0,
      icon: UsersRound,
      href: `/w/${workspace_slug}/leads`,
    },
    {
      label: 'Pipelines',
      value: boardCount ?? 0,
      icon: KanbanSquare,
      href: `/w/${workspace_slug}/boards`,
    },
    {
      label: 'Forms',
      value: formCount ?? 0,
      icon: FileInput,
      href: `/w/${workspace_slug}/forms`,
    },
  ]

  const shortcuts = [
    {
      title: 'Leads',
      body: 'Review new and active records.',
      href: `/w/${workspace_slug}/leads`,
      icon: UsersRound,
    },
    {
      title: 'Boards',
      body: 'Edit your pipeline structure.',
      href: `/w/${workspace_slug}/boards`,
      icon: KanbanSquare,
    },
    {
      title: 'Forms',
      body: 'Manage intake and routing.',
      href: `/w/${workspace_slug}/forms`,
      icon: FileInput,
    },
    {
      title: 'Settings',
      body: 'Usage, plan, and integrations.',
      href: `/w/${workspace_slug}/settings`,
      icon: Settings2,
    },
  ]

  const statusToneClasses =
    priority.tone === 'warning'
      ? 'border-amber-500/30 bg-amber-500/10'
      : 'border-emerald-500/30 bg-emerald-500/10'

  const statusIcon =
    priority.tone === 'warning' ? (
      <AlertCircle className="h-5 w-5 text-amber-500" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    )

  return (
    <div className="space-y-5">
      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="surface-panel hero-grid relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-primary/10 to-transparent xl:block" />
          <CardContent className="relative p-6 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="eyebrow w-fit">
                  <Sparkles className="h-3.5 w-3.5" />
                  Dashboard
                </span>
                <div className="space-y-2">
                  <h2 className="max-w-3xl text-3xl font-semibold sm:text-4xl">{workspace.name}</h2>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Start with the highlighted task, then use the shortcuts below.
                  </p>
                </div>
              </div>

              {setupComplete === 3 ? (
                <div className="rounded-[1.35rem] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">You're all set up!</span>
                  </div>
                  <p className="mt-1.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                    Pipeline, form, and first lead — done.
                  </p>
                  <Link
                    href={`/w/${workspace_slug}/team`}
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 underline underline-offset-2 hover:opacity-80"
                  >
                    Invite a teammate
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-[1.35rem] border border-border/70 bg-background/65 px-4 py-3 text-sm min-w-[200px]">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Setup checklist</div>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { label: 'Create a pipeline', done: (boardCount ?? 0) > 0, href: `/w/${workspace_slug}/boards` },
                      { label: 'Add an intake form', done: (formCount ?? 0) > 0, href: `/w/${workspace_slug}/forms` },
                      { label: 'Receive first lead', done: (leadCount ?? 0) > 0, href: `/w/${workspace_slug}/leads` },
                    ].map((step) => (
                      <Link key={step.label} href={step.href} className="flex items-center gap-2 text-xs hover:opacity-80">
                        {step.done
                          ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          : <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        <span className={step.done ? 'text-muted-foreground line-through' : 'font-medium'}>
                          {step.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {metrics.map((metric) => {
                const Icon = metric.icon

                return (
                  <Link
                    key={metric.label}
                    href={metric.href}
                    className="rounded-[1.5rem] border border-border/70 bg-background/60 px-4 py-4 transition hover:border-primary/30 hover:bg-background/75"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{metric.label}</span>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{metric.value}</div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className={`surface-card ${statusToneClasses}`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {statusIcon}
              <span className="eyebrow w-fit">{priority.eyebrow}</span>
            </div>
            <CardTitle className="text-2xl">{priority.title}</CardTitle>
            <CardDescription className="text-base text-foreground/80">{priority.body}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {/* One-click test lead when boards exist but no leads yet */}
              {(boardCount ?? 0) > 0 && (leadCount ?? 0) === 0 && (
                <form action={async () => {
                  'use server'
                  const result = await createTestLead(workspace_slug)
                  if (result?.error) {
                    redirect(`/w/${workspace_slug}?error=${encodeURIComponent(result.error)}`)
                  }
                  redirect(`/w/${workspace_slug}/leads/${result.leadId}`)
                }}>
                  <Button type="submit" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Create test lead
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}
              <Button asChild variant={(boardCount ?? 0) > 0 && (leadCount ?? 0) === 0 ? 'outline' : 'default'} className="w-full justify-between">
                <Link href={priority.href}>
                  {priority.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tasks due today */}
      {dueTasks && dueTasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Due today · {dueTasks.length} task{dueTasks.length === 1 ? '' : 's'}
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {dueTasks.map((task) => {
              const leadName = (task.leads as { firm_name?: string } | null)?.firm_name
              const isOverdue = task.due_date && task.due_date < todayISO
              return (
                <div
                  key={task.id}
                  className={[
                    'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
                    isOverdue
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-amber-500/30 bg-amber-500/5',
                  ].join(' ')}
                >
                  <Clock className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isOverdue ? 'text-destructive' : 'text-amber-500'}`} />
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">{task.title}</p>
                    {leadName && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{leadName}</p>
                    )}
                    {isOverdue && (
                      <p className="mt-0.5 text-xs text-destructive font-medium">Overdue</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-right">
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
              <Link href={`/w/${workspace_slug}/leads`}>View all leads →</Link>
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold sm:text-3xl">Quick access</h3>
            <p className="text-sm text-muted-foreground">Jump straight to the part of the CRM you need.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {shortcuts.map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.title} className="surface-card surface-card-hover">
                <CardHeader className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                    <CardDescription>{item.body}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full justify-between">
                    <Link href={item.href}>
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

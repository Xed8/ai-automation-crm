import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileInput,
  FlaskConical,
  KanbanSquare,
  Settings2,
  UsersRound,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { createTestLead } from '@/app/actions/crm'
import { OnboardingChecklist } from '@/components/shared/onboarding-checklist'

type PriorityCard = {
  tone: 'warning' | 'success'
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
  const { workspace, user } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()

  const todayISO = new Date().toISOString().slice(0, 10)

  const [
    { count: leadCount },
    { count: boardCount },
    { count: formCount },
    { count: automationCount },
    { data: dueTasks },
    { data: memberRow },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('boards').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('lead_forms').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('automation_rules').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase
      .from('tasks')
      .select('id, title, due_date, leads(firm_name)')
      .eq('workspace_id', workspace.id)
      .eq('is_completed', false)
      .lte('due_date', todayISO)
      .order('due_date', { ascending: true })
      .limit(5),
    supabase
      .from('workspace_members')
      .select('onboarding_dismissed, onboarding_completed_steps')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .single(),
  ])

  const onboardingDismissed = memberRow?.onboarding_dismissed ?? false
  const onboardingCompletedSteps: string[] = memberRow?.onboarding_completed_steps ?? []
  const showOnboarding = !onboardingDismissed

  let priority: PriorityCard

  if ((boardCount ?? 0) === 0) {
    priority = {
      tone: 'warning',
      title: 'Create your first pipeline',
      body: 'Set up a board before your team starts moving leads.',
      href: `/w/${workspace_slug}/boards`,
      cta: 'Open boards',
    }
  } else if ((formCount ?? 0) === 0) {
    priority = {
      tone: 'warning',
      title: 'Add a lead intake form',
      body: 'Give this workspace a place for new leads to enter.',
      href: `/w/${workspace_slug}/forms`,
      cta: 'Open forms',
    }
  } else if ((leadCount ?? 0) === 0) {
    priority = {
      tone: 'warning',
      title: 'Send a test lead',
      body: 'Your setup is ready. Create a test lead to confirm the full pipeline works.',
      href: `/w/${workspace_slug}/leads`,
      cta: 'Open leads',
    }
  } else {
    priority = {
      tone: 'success',
      title: 'Workspace is live',
      body: 'Boards, forms, and leads are all active. Your pipeline is running.',
      href: `/w/${workspace_slug}/leads`,
      cta: 'View leads',
    }
  }

  const stats = [
    {
      label: 'Leads',
      value: leadCount ?? 0,
      icon: UsersRound,
      href: `/w/${workspace_slug}/leads`,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Pipelines',
      value: boardCount ?? 0,
      icon: KanbanSquare,
      href: `/w/${workspace_slug}/boards`,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Forms',
      value: formCount ?? 0,
      icon: FileInput,
      href: `/w/${workspace_slug}/forms`,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Automations',
      value: automationCount ?? 0,
      icon: Zap,
      href: `/w/${workspace_slug}/automations`,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ]

  const navLinks = [
    { label: 'Leads', href: `/w/${workspace_slug}/leads`, icon: UsersRound },
    { label: 'Boards', href: `/w/${workspace_slug}/boards`, icon: KanbanSquare },
    { label: 'Forms', href: `/w/${workspace_slug}/forms`, icon: FileInput },
    { label: 'Automations', href: `/w/${workspace_slug}/automations`, icon: Zap },
    { label: 'Settings', href: `/w/${workspace_slug}/settings`, icon: Settings2 },
  ]

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1
          className="text-2xl font-extrabold tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
        >
          {workspace.name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
          Overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <div
                  className="text-2xl font-semibold tabular-nums leading-none"
                  style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}
                >
                  {s.value}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
                  {s.label}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingChecklist
          workspaceSlug={workspace_slug}
          completedSteps={onboardingCompletedSteps}
          hasBoard={(boardCount ?? 0) > 0}
          hasLead={(leadCount ?? 0) > 0}
          hasForm={(formCount ?? 0) > 0}
          hasAutomation={(automationCount ?? 0) > 0}
        />
      )}

      {/* Main two-column area */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">

        {/* Left — priority + due tasks */}
        <div className="space-y-5">

          {/* Priority action */}
          <div
            className="rounded-xl p-5"
            style={{
              background: priority.tone === 'warning' ? 'rgba(245,158,11,0.06)' : 'rgba(52,211,153,0.06)',
              border: `1px solid ${priority.tone === 'warning' ? 'rgba(245,158,11,0.18)' : 'rgba(52,211,153,0.18)'}`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {priority.tone === 'warning'
                    ? <AlertCircle className="h-4 w-4 text-amber-400" />
                    : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  <span
                    className="text-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
                  >
                    {priority.tone === 'warning' ? 'Action needed' : 'All good'}
                  </span>
                </div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}
                >
                  {priority.title}
                </h2>
                <p className="text-sm" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
                  {priority.body}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(boardCount ?? 0) > 0 && (leadCount ?? 0) === 0 && (
                <form action={async () => {
                  'use server'
                  const result = await createTestLead(workspace_slug)
                  if (result?.error) {
                    redirect(`/w/${workspace_slug}?error=${encodeURIComponent(result.error)}`)
                  }
                  redirect(`/w/${workspace_slug}/leads/${result.leadId}`)
                }}>
                  <Button type="submit" size="sm" className="gap-2">
                    <FlaskConical className="h-3.5 w-3.5" />
                    Create test lead
                  </Button>
                </form>
              )}
              <Button asChild size="sm" variant={priority.tone === 'success' ? 'default' : 'outline'} className="gap-2">
                <Link href={priority.href}>
                  {priority.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Due tasks */}
          {dueTasks && dueTasks.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span
                    className="text-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
                  >
                    Due today · {dueTasks.length}
                  </span>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-6 text-xs" style={{ color: 'var(--lp-muted)' } as React.CSSProperties}>
                  <Link href={`/w/${workspace_slug}/leads`}>View all</Link>
                </Button>
              </div>
              <div>
                {dueTasks.map((task, i) => {
                  const leadName = (task.leads as { firm_name?: string } | null)?.firm_name
                  const isOverdue = task.due_date && task.due_date < todayISO
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 px-4 py-3"
                      style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : undefined}
                    >
                      <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug truncate" style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-dm)' }}>
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
                          {leadName ?? '—'}{isOverdue ? ' · Overdue' : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right — quick nav */}
        <div className="space-y-2">
          <p
            className="px-1 text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            Navigate
          </p>
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--lp-text)', fontFamily: 'var(--font-dm)' }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: 'var(--lp-muted)' }} />
                {link.label}
                <ArrowRight className="ml-auto h-3.5 w-3.5" style={{ color: 'rgba(245,243,238,0.2)' }} />
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}

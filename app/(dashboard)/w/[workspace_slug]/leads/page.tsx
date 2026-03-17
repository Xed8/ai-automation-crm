import Link from 'next/link'
import { ArrowRight, BotMessageSquare, BriefcaseBusiness, CircleDollarSign, Clock, Funnel, Search, TrendingUp } from 'lucide-react'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { getWorkspaceUsage } from '@/lib/billing/quotas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default async function LeadsIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace_slug: string }>
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { workspace_slug } = await params
  const { q, status } = await searchParams
  const { workspace } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()

  // Build filtered query
  let query = supabase
    .from('leads')
    .select('*, boards(name), stages(name)')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  if (q?.trim()) {
    const term = q.trim()
    query = query.or(`firm_name.ilike.%${term}%,contact_name.ilike.%${term}%,email.ilike.%${term}%`)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  } else if (!status) {
    query = query.eq('status', 'active')
  }

  const { data: leads, error } = await query

  if (error) {
    return <div className="p-6 text-destructive">Failed to load leads.</div>
  }

  // Usage for progress bars
  const usage = await getWorkspaceUsage(workspace.id)
  const usagePct = usage.limits.max_leads_per_month >= 999999
    ? 0
    : Math.round((usage.leads_created / usage.limits.max_leads_per_month) * 100)
  const showUsageBanner = usagePct >= 70
  const aiPct = usage.limits.max_ai_tokens_per_month >= 9999999
    ? 0
    : Math.round((usage.ai_tokens_used / usage.limits.max_ai_tokens_per_month) * 100)
  const showAiBanner = aiPct >= 70

  const activeLeads = leads?.filter((l) => l.status === 'active') ?? []
  const totalValue = (leads ?? []).reduce((sum, l) => sum + (l.value ?? 0), 0)

  const isFiltered = !!(q?.trim()) || (status && status !== 'active')

  return (
    <div className="space-y-5">
      {/* Leads usage banner */}
      {showUsageBanner && (
        <div className={[
          'flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm',
          usagePct >= 100
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        ].join(' ')}>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>
              <strong>{usage.leads_created}</strong> / {usage.limits.max_leads_per_month >= 999999 ? '∞' : usage.limits.max_leads_per_month} leads used this month
              {usagePct >= 100 ? ' — limit reached.' : ` — ${100 - usagePct}% remaining.`}
            </span>
          </div>
          <Button asChild size="sm" variant={usagePct >= 100 ? 'destructive' : 'outline'} className="shrink-0 h-7 text-xs">
            <Link href={`/w/${workspace_slug}/settings?tab=billing`}>Upgrade to Pro — 10× more leads</Link>
          </Button>
        </div>
      )}

      {/* AI token usage banner */}
      {showAiBanner && (
        <div className={[
          'flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm',
          aiPct >= 100
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
        ].join(' ')}>
          <div className="flex items-center gap-2">
            <BotMessageSquare className="h-4 w-4 shrink-0" />
            <span>
              AI: <strong>{usage.ai_tokens_used.toLocaleString()}</strong> / {usage.limits.max_ai_tokens_per_month.toLocaleString()} tokens used
              {aiPct >= 100 ? ' — limit reached.' : ` — ${100 - aiPct}% remaining.`}
            </span>
          </div>
          <Button asChild size="sm" variant={aiPct >= 100 ? 'destructive' : 'outline'} className="shrink-0 h-7 text-xs">
            <Link href={`/w/${workspace_slug}/settings?tab=billing`}>Upgrade to Pro — 50× more AI</Link>
          </Button>
        </div>
      )}

      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Lead pipeline</span>
            <div>
              <h2 className="text-4xl font-semibold sm:text-5xl">Every lead, one view.</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Review, search, and filter all leads in {workspace.name}.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/w/${workspace_slug}/boards`}>
              Open pipelines
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="surface-card rounded-lg px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">All leads</span>
              <Funnel className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-semibold">{leads?.length ?? 0}</div>
          </div>
          <div className="surface-card rounded-lg px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active</span>
              <BriefcaseBusiness className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-semibold">{activeLeads.length}</div>
          </div>
          <div className="surface-card rounded-lg px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tracked value</span>
              <CircleDollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-semibold">${totalValue.toLocaleString()}</div>
          </div>
        </div>
      </section>

      {/* Search + filter bar */}
      <form method="GET" className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search firm, contact, email…"
            className="h-9 pl-9 text-sm"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? 'active'}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <Button type="submit" size="sm" className="h-9">Filter</Button>
        {isFiltered && (
          <Button asChild variant="ghost" size="sm" className="h-9 text-muted-foreground">
            <Link href={`/w/${workspace_slug}/leads`}>Clear</Link>
          </Button>
        )}
      </form>

      {(!leads || leads.length === 0) ? (
        <Card className="surface-card p-8 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">{isFiltered ? 'No leads match your search' : 'No leads yet'}</CardTitle>
            <CardDescription className="text-base">
              {isFiltered
                ? 'Try adjusting your search or filter.'
                : 'New leads appear here after being created in a pipeline or submitted through a form.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Firm</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden md:table-cell">Pipeline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden md:table-cell">Stage</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden lg:table-cell">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hidden xl:table-cell">Updated</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => {
                  const days = lead.updated_at
                    ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / 86400000)
                    : null
                  return (
                    <tr key={lead.id} className="group hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">
                        {lead.firm_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">
                        {lead.contact_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {(lead.boards?.name as string) || '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="secondary" className="font-normal">
                          {(lead.stages?.name as string) || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground hidden lg:table-cell">
                        {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge variant={lead.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {days !== null && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            {days === 0 ? 'Today' : `${days}d ago`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/w/${workspace_slug}/leads/${lead.id}`} aria-label={`Open ${lead.firm_name}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

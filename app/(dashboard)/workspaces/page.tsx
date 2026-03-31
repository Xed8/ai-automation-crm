export const revalidate = 60

import Link from 'next/link'
import { ArrowRight, Building2, Layers3, Plus, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { checkWorkspaceLimit } from '@/lib/billing/quotas'
import { Button } from '@/components/ui/button'
import { DeleteWorkspaceButton } from '@/components/shared/delete-workspace-button'

function formatWorkspaceDate(value: string | null) {
  if (!value) return 'Recently created'
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
    return <div style={{ color: 'var(--lp-accent)' }}>Failed to load workspaces</div>
  }

  const workspaceCount = workspaces.length
  const quota = user ? await checkWorkspaceLimit(user.id) : null
  const showQuotaBanner = quota && !quota.allowed

  return (
    <div className="space-y-6">
      {/* Quota banner */}
      {showQuotaBanner && (
        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#fbbf24',
            fontFamily: 'var(--font-dm)',
          }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>
              You&apos;ve used <strong>{quota.current}</strong> / {quota.limit} workspaces on your plan.
              Upgrade to create more.
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 h-7 text-xs">
            <Link href="/workspaces/create">Upgrade →</Link>
          </Button>
        </div>
      )}

      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-7 py-8"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Ambient orb */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 320,
            height: 320,
            top: '-30%',
            right: '-5%',
            background: 'radial-gradient(circle, rgba(255,77,28,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'var(--lp-accent)', fontFamily: 'var(--font-dm)' }}
            >
              Workspace hub
            </p>
            <h2
              className="text-3xl font-extrabold tracking-[-0.03em]"
              style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}
            >
              Choose where to work today.
            </h2>
            <p className="text-sm" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
              Each workspace is an isolated CRM for a client or team.
            </p>
          </div>

          {/* Stats chips */}
          <div className="flex shrink-0 gap-3">
            <div
              className="rounded-xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
                <Layers3 className="h-3.5 w-3.5" style={{ color: 'var(--lp-accent)' }} />
                Workspaces
              </div>
              <div
                className="mt-2 text-3xl font-extrabold"
                style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}
              >
                {workspaceCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p
            className="text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            Your workspaces
          </p>
          <Button
            asChild
            size="sm"
            className="gap-2 text-sm font-semibold h-8"
            style={{ background: 'var(--lp-accent)', color: '#fff', border: 'none' }}
          >
            <Link href="/workspaces/create">
              <Plus className="h-3.5 w-3.5" />
              New
            </Link>
          </Button>
        </div>

        {workspaceCount === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(255,77,28,0.12)' }}
            >
              <Building2 className="h-6 w-6" style={{ color: 'var(--lp-accent)' }} />
            </div>
            <h3
              className="mt-4 text-xl font-bold"
              style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}
            >
              No workspaces yet
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
              Create your first workspace to start using the CRM.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-5 gap-2"
              style={{ background: 'var(--lp-accent)', color: '#fff', border: 'none' }}
            >
              <Link href="/workspaces/create">
                <Plus className="h-3.5 w-3.5" />
                Create a workspace
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="group rounded-2xl p-5 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-lg font-bold"
                      style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}
                    >
                      {workspace.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
                      /{workspace.slug}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontFamily: 'var(--font-dm)' }}
                  >
                    Active
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>Created</div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-dm)' }}>
                      {formatWorkspaceDate(workspace.created_at)}
                    </div>
                  </div>
                  <div
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>Path</div>
                    <div className="mt-1 text-sm font-semibold truncate" style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-dm)' }}>
                      /w/{workspace.slug}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 justify-between text-sm font-semibold"
                    style={{ background: 'var(--lp-accent)', color: '#fff', border: 'none' }}
                  >
                    <Link href={`/w/${workspace.slug}`}>
                      Open workspace
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <DeleteWorkspaceButton
                    workspaceSlug={workspace.slug}
                    workspaceName={workspace.name}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

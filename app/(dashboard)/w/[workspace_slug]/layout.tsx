import Link from 'next/link'
import { ArrowLeftRight, LogOut, UserCircle2 } from 'lucide-react'
import { signout } from '@/app/actions/auth'
import { BrandMark } from '@/components/shared/brand-mark'
import { WorkspaceNav } from '@/components/shared/workspace-nav'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { requireWorkspaceScope } from '@/lib/workspace-context'

export default async function WorkspaceDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace_slug: string }>;
}) {
  const { workspace_slug } = await params
  const { user, workspace, role } = await requireWorkspaceScope(workspace_slug)

  return (
    <div className="dash flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-60 shrink-0 border-r lg:flex lg:flex-col overflow-y-auto" style={{ background: 'var(--ink-dim)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <BrandMark href="/workspaces" compact />
        </div>

        {/* Workspace info */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(245,243,238,0.3)', fontFamily: 'var(--font-dm)' }}>
            Workspace
          </p>
          <p className="mt-1 truncate text-sm font-semibold leading-snug" style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}>
            {workspace.name}
          </p>
          <span
            className="mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize"
            style={{ background: 'rgba(255,77,28,0.12)', color: 'var(--lp-accent)', border: '1px solid rgba(255,77,28,0.2)', fontFamily: 'var(--font-dm)' }}
          >
            {role}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3">
          <WorkspaceNav workspaceSlug={workspace_slug} />
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: 'var(--lp-accent)', color: '#fff', fontFamily: 'var(--font-syne)' }}
            >
              {user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="truncate text-xs" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
              {user.email}
            </span>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start text-xs font-normal"
            style={{ color: 'var(--lp-muted)' } as React.CSSProperties}
          >
            <Link href={`/w/${workspace_slug}/settings/profile`}>
              <UserCircle2 className="mr-2 h-3.5 w-3.5" />
              Profile
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start text-xs font-normal"
            style={{ color: 'var(--lp-muted)' } as React.CSSProperties}
          >
            <Link href="/workspaces">
              <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
              Switch workspace
            </Link>
          </Button>
          <form action={signout}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start text-xs font-normal"
              style={{ color: 'var(--lp-muted)' } as React.CSSProperties}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex h-14 shrink-0 items-center px-4 lg:px-6"
          style={{ background: 'var(--ink-dim)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="mr-4 lg:hidden">
            <BrandMark href="/workspaces" compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
              {workspace.name}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell
              workspaceSlug={workspace_slug}
              workspaceId={workspace.id}
              userId={user.id}
            />
            <Button asChild variant="outline" size="sm" className="lg:hidden">
              <Link href="/workspaces">Switch</Link>
            </Button>
            <form action={signout} className="lg:hidden">
              <Button variant="ghost" size="sm">Sign out</Button>
            </form>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="border-b px-3 py-2 lg:hidden" style={{ background: 'var(--ink-dim)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <WorkspaceNav workspaceSlug={workspace_slug} orientation="horizontal" />
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

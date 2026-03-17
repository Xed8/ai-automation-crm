import Link from 'next/link'
import { ArrowLeftRight, LogOut } from 'lucide-react'
import { signout } from '@/app/actions/auth'
import { BrandMark } from '@/components/shared/brand-mark'
import { WorkspaceNav } from '@/components/shared/workspace-nav'
import { Badge } from '@/components/ui/badge'
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card lg:flex lg:flex-col overflow-y-auto">
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <BrandMark href="/workspaces" compact />
        </div>

        {/* Workspace info */}
        <div className="border-b border-border px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Workspace
          </p>
          <p className="mt-1 truncate text-sm font-semibold leading-snug">{workspace.name}</p>
          <Badge variant="secondary" className="mt-2 text-[10px] capitalize">{role}</Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3">
          <WorkspaceNav workspaceSlug={workspace_slug} />
        </nav>

        {/* User footer */}
        <div className="space-y-0.5 border-t border-border px-2 py-2">
          <div className="truncate px-3 py-1.5 text-xs text-muted-foreground">{user.email}</div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start text-xs font-normal"
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
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-border bg-card px-4 lg:px-6">
          <div className="mr-4 lg:hidden">
            <BrandMark href="/workspaces" compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-muted-foreground">{workspace.name}</p>
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
        <div className="border-b border-border bg-card px-3 py-2 lg:hidden">
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

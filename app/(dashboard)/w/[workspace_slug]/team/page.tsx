export const revalidate = 60

import { Users } from 'lucide-react'
import { createPrivilegedServerClient } from '@/lib/supabase/privileged'
import { requireWorkspaceScope } from '@/lib/workspace-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamInviteForm } from '@/components/team/team-invite-form'
import { RemoveMemberButton } from '@/components/team/remove-member-button'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-primary/10 text-primary border-primary/20',
  admin: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  member: '',
}

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace_slug: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { workspace_slug } = await params
  const { error: pageError } = await searchParams
  const { workspace, role, user } = await requireWorkspaceScope(workspace_slug)
  const supabase = await createPrivilegedServerClient()

  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, role, created_at, profiles(full_name, email)')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  const canManage = role === 'owner' || role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="space-y-3">
          <span className="eyebrow">
            <Users className="h-3.5 w-3.5" />
            Team
          </span>
          <div>
            <h2 className="text-4xl font-semibold sm:text-5xl">Your workspace team.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Invite teammates to collaborate on leads, pipelines, and automations in {workspace.name}.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="surface-card rounded-lg px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Members</div>
            <div className="mt-3 text-3xl font-semibold">{members?.length ?? 0}</div>
          </div>
          <div className="surface-card rounded-lg px-4 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Your role</div>
            <div className="mt-3 text-2xl font-semibold capitalize">{role}</div>
          </div>
        </div>
      </section>

      {pageError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      )}

      {/* Invite form */}
      {canManage && (
        <Card className="surface-card">
          <CardHeader>
            <CardTitle>Invite a teammate</CardTitle>
            <CardDescription>
              They will receive an email invite. If they already have an account, they will be added immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamInviteForm workspaceSlug={workspace_slug} />
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Current members
        </h3>
        <div className="grid gap-2">
          {members?.map((member) => {
            const profile = member.profiles as { full_name?: string; email?: string } | null
            const isYou = member.user_id === user.id
            const roleColorClass = ROLE_COLORS[member.role] ?? ''

            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">
                      {profile?.full_name || profile?.email || 'Unknown user'}
                    </span>
                    {isYou && <span className="text-xs text-muted-foreground">(you)</span>}
                    <Badge variant="outline" className={`text-xs capitalize ${roleColorClass}`}>
                      {member.role}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {profile?.email}
                  </p>
                </div>

                {canManage && !isYou && member.role !== 'owner' && (
                  <RemoveMemberButton
                    workspaceSlug={workspace_slug}
                    userId={member.user_id}
                    displayName={profile?.full_name || profile?.email || 'this member'}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

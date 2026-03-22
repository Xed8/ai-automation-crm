import { requireWorkspaceScope } from '@/lib/workspace-context'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/shared/profile-form'

export default async function ProfileSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace_slug: string }>
  searchParams: Promise<{ status?: string; message?: string }>
}) {
  const { workspace_slug } = await params
  const { status, message } = await searchParams
  const { user } = await requireWorkspaceScope(workspace_slug)

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const messageClassName =
    status === 'success'
      ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200'
      : 'rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'

  return (
    <div className="space-y-6">
      <section className="surface-panel px-5 py-5">
        <div className="space-y-1.5">
          <span className="eyebrow">Account</span>
          <h1 className="text-2xl font-semibold">Profile settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal information. Changes apply across all workspaces.
          </p>
        </div>
      </section>

      {message && <div className={messageClassName}>{message}</div>}

      <ProfileForm
        workspaceSlug={workspace_slug}
        initialFullName={profile?.full_name ?? ''}
        initialEmail={user.email ?? ''}
        initialAvatarUrl={profile?.avatar_url ?? null}
        userId={user.id}
      />
    </div>
  )
}

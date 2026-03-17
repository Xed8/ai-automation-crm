import { createWorkspace } from "@/app/actions/workspaces"
import { checkWorkspaceLimit, PLAN_LIMITS } from "@/lib/billing/quotas"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Link2, Lock, Sparkles } from "lucide-react"

export default async function CreateWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  // Check workspace limit before rendering the form
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const quota = user ? await checkWorkspaceLimit(user.id) : null
  const atLimit = quota && !quota.allowed

  if (atLimit) {
    const proLimit = PLAN_LIMITS.pro.max_workspaces
    return (
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="surface-card">
          <CardHeader className="space-y-4">
            <span className="eyebrow w-fit">
              <Lock className="h-3.5 w-3.5" />
              Workspace limit reached
            </span>
            <div>
              <CardTitle className="text-3xl">You&apos;ve used all {quota.limit} workspaces on your current plan.</CardTitle>
              <CardDescription className="mt-2 text-base">
                Upgrade to Pro to create up to {proLimit} workspaces, or remove an existing one to free up a slot.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.25rem] border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-900 dark:text-amber-200">
              You currently own <strong>{quota.current}</strong> workspace{quota.current === 1 ? '' : 's'}.
              Your plan allows up to <strong>{quota.limit}</strong>.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-border bg-muted/30 px-4 py-4 text-sm">
                <div className="font-semibold">Free plan</div>
                <div className="mt-1 text-muted-foreground">Up to {PLAN_LIMITS.free.max_workspaces} workspaces</div>
              </div>
              <div className="rounded-[1.35rem] border border-primary/30 bg-primary/5 px-4 py-4 text-sm">
                <div className="font-semibold text-primary">Pro plan</div>
                <div className="mt-1 text-muted-foreground">Up to {proLimit} workspaces + more leads &amp; AI</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="ghost">
              <Link href="/workspaces"><ArrowLeft className="h-4 w-4" />Back</Link>
            </Button>
            <Button asChild className="sm:ml-auto">
              <Link href={`/workspaces`}>Upgrade a workspace to Pro →</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="surface-card border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl">What&apos;s included in Pro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              `Up to ${proLimit} workspaces`,
              'Unlimited leads per month',
              '500,000 AI tokens/mo',
              'Priority support',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="surface-card">
        <CardHeader className="space-y-4">
          <span className="eyebrow w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            New workspace
          </span>
          <div>
            <CardTitle className="text-3xl">Create a focused CRM environment</CardTitle>
            <CardDescription className="mt-2 text-base">
              Give your team a dedicated space for leads, boards, forms, settings, and future automation rules.
            </CardDescription>
          </div>
        </CardHeader>
        <form action={createWorkspace} className="space-y-1">
          <CardContent className="space-y-5">
            {message && (
              <div className="rounded-[1.25rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {message}
              </div>
            )}
            {!hasServiceRoleKey && (
              <div className="rounded-[1.25rem] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                Runtime check: <strong>`SUPABASE_SERVICE_ROLE_KEY` is not loaded</strong>. Workspace creation will rely on
                database bootstrap RLS. If that SQL policy is not applied in Supabase, owner creation in
                `workspace_members` will fail.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Acme Growth Team"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium text-foreground">Unique URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="acme-growth"
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens"
                required
              />
              <p className="text-xs text-muted-foreground">
                This becomes your workspace URL: <span className="font-medium text-foreground">/w/acme-growth</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
            <Button asChild variant="ghost">
              <Link href="/workspaces">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit">Create workspace</Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-2xl">Before you launch</CardTitle>
          <CardDescription>
            A few naming choices make the workspace easier for your team to recognize and share.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[1.5rem] bg-secondary/70 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Use the client or team name</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Clear naming keeps workspace switching fast when you manage several environments.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-secondary/70 p-4">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Pick a stable slug</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Slugs work best when they are short, lowercase, and easy to type in a hurry.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            After creation, you can head straight into leads, boards, forms, and settings from the redesigned shell.
          </div>
          <div className="rounded-[1.5rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Runtime status: service-role key {hasServiceRoleKey ? 'detected' : 'missing'}.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

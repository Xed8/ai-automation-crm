export const revalidate = 60

import { checkWorkspaceLimit, PLAN_LIMITS } from "@/lib/billing/quotas"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react"
import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form"

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
  if (!user) redirect('/login')
  const quota = await checkWorkspaceLimit(user.id)
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
              <Link href={`/workspaces`}>Manage workspaces →</Link>
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

  return <CreateWorkspaceForm message={message} hasServiceRoleKey={hasServiceRoleKey} />
}

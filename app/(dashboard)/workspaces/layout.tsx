import Link from 'next/link'
import { BadgeCheck, LogOut, Plus, Rows3 } from 'lucide-react'
import { signout } from '@/app/actions/auth'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full flex-col gap-5">
        <header className="surface-panel relative overflow-hidden px-6 py-6 sm:px-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <BrandMark href="/" />
              <div className="space-y-2">
                <span className="eyebrow">
                  <Rows3 className="h-3.5 w-3.5" />
                  Workspace hub
                </span>
                <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">Pick a workspace and keep moving.</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user?.email ? (
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-3 text-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Signed in</div>
                    <div className="font-semibold text-foreground">{user.email}</div>
                  </div>
                </div>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/">View site</Link>
              </Button>
              <Button asChild>
                <Link href="/workspaces/create">
                  <Plus className="h-4 w-4" />
                  New workspace
                </Link>
              </Button>
              <form action={signout}>
                <Button variant="ghost" className="justify-between">
                  Sign out
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </header>

        <div>{children}</div>
      </div>
    </div>
  )
}

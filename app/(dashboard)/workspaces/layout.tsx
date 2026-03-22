import Link from 'next/link'
import { LogOut, Plus } from 'lucide-react'
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
    <div className="dash min-h-screen" style={{ background: 'var(--ink)' }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top bar */}
        <header
          className="flex items-center justify-between rounded-2xl px-5 py-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <BrandMark href="/" />

          <div className="flex items-center gap-3">
            {user?.email && (
              <span
                className="hidden text-xs sm:block"
                style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
              >
                {user.email}
              </span>
            )}
            <Button
              asChild
              size="sm"
              className="gap-2 text-sm font-semibold"
              style={{ background: 'var(--lp-accent)', color: '#fff', border: 'none' }}
            >
              <Link href="/workspaces/create">
                <Plus className="h-3.5 w-3.5" />
                New workspace
              </Link>
            </Button>
            <form action={signout}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs"
                style={{ color: 'var(--lp-muted)' } as React.CSSProperties}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </form>
          </div>
        </header>

        <div>{children}</div>
      </div>
    </div>
  )
}

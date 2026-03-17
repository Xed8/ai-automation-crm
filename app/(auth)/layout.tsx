import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-panel hero-grid relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
          <div className="relative flex h-full flex-col gap-8">
            <div className="flex items-start justify-between gap-4">
              <BrandMark href="/" />
              <Button asChild variant="ghost">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>

            <div className="space-y-5 pt-4">
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Secure access
              </span>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">
                  Walk into a calmer CRM experience.
                </h1>
                <p className="max-w-xl text-base text-muted-foreground">
                  Sign in to manage workspaces, route inbound leads, and keep your team inside one clear operational view.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="surface-card rounded-[1.5rem] px-4 py-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div className="mt-3 text-sm font-semibold">Secure workspace boundaries</div>
                <div className="mt-1 text-sm text-muted-foreground">Scoped access and cleaner team context.</div>
              </div>
              <div className="surface-card rounded-[1.5rem] px-4 py-4">
                <Workflow className="h-5 w-5 text-primary" />
                <div className="mt-3 text-sm font-semibold">Pipeline-first workflow</div>
                <div className="mt-1 text-sm text-muted-foreground">Boards, leads, and forms connected by default.</div>
              </div>
              <div className="surface-card rounded-[1.5rem] px-4 py-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <div className="mt-3 text-sm font-semibold">AI assist where it helps</div>
                <div className="mt-1 text-sm text-muted-foreground">Summaries and next steps without clutter.</div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  )
}

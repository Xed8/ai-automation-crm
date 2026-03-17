import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  Webhook,
} from 'lucide-react'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const highlights = [
  {
    title: 'Capture every lead',
    description: 'Route forms, webhook intake, and manual entries into one clean pipeline without losing context.',
    icon: Webhook,
  },
  {
    title: 'Keep sellers moving',
    description: 'Boards, lead records, and guided next actions help your team follow up before deals cool off.',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Ship AI assist safely',
    description: 'Summaries, suggestions, and automation layers live beside the CRM instead of in disconnected tools.',
    icon: Bot,
  },
]

const stats = [
  { label: 'Live intake surfaces', value: 'Forms + webhooks' },
  { label: 'Operational view', value: 'Pipelines, leads, settings' },
  { label: 'Built for', value: 'Agency delivery teams' },
]

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="surface-panel flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="surface-panel hero-grid relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12 lg:px-12">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-6">
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Agency operations, simplified
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-5xl font-semibold leading-none sm:text-6xl">
                  A sharper UI for lead capture, pipeline control, and AI follow-up.
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Agency CRM brings your forms, deals, team actions, and workflow settings into one
                  command surface that actually feels good to operate.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/register">
                    Create your workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/workspaces">Open dashboard</Link>
                </Button>
              </div>
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="surface-card rounded-[1.5rem] px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-foreground">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card rounded-[2rem] p-4 sm:p-5">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Command center preview</div>
                    <div className="text-sm text-muted-foreground">
                      Leads, boards, and automations in one flow
                    </div>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Live workspace
                  </div>
                </div>
                <div className="grid gap-4 pt-4 lg:grid-cols-[1fr_0.85fr]">
                  <div className="space-y-3">
                    {['New lead intake', 'Proposal sent', 'Contract ready'].map((column, index) => (
                      <div key={column} className="rounded-[1.25rem] border border-border/60 bg-card/70 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">{column}</div>
                          <span className="text-xs text-muted-foreground">{index + 2} cards</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="rounded-2xl bg-secondary/65 px-3 py-3 text-sm">
                            Revamp sprint for Finch Studio
                          </div>
                          <div className="rounded-2xl border border-dashed border-border/70 px-3 py-3 text-sm text-muted-foreground">
                            AI suggested next step queued
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-4">
                    <div className="text-sm font-semibold">Lead summary</div>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                      <div className="rounded-2xl bg-secondary/55 p-3 text-foreground">
                        Finch Studio wants a faster handoff from inbound form to account strategist.
                      </div>
                      <div className="rounded-2xl border border-border/60 p-3">
                        Recommended next action: create kickoff task and assign within 15 minutes.
                      </div>
                      <div className="rounded-2xl border border-dashed border-border/60 p-3">
                        Billing snapshot: usage healthy, workspace ready to scale.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {highlights.map((highlight) => {
            const Icon = highlight.icon

            return (
              <Card key={highlight.title} className="surface-card surface-card-hover">
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{highlight.title}</CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {highlight.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </section>

        <section className="surface-panel flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="space-y-2">
            <div className="eyebrow">
              <ShieldCheck className="h-3.5 w-3.5" />
              Ready to upgrade the app shell
            </div>
            <h2 className="text-3xl font-semibold">Step into the redesigned CRM workspace.</h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Sign in, create a workspace, and move through a UI that feels more deliberate from first click to
              lead detail.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/workspaces">
              Launch dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </main>
  )
}

'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, X, ArrowRight } from 'lucide-react'
import { completeOnboardingStep, dismissOnboarding, type OnboardingStep } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Step {
  id: OnboardingStep
  label: string
  description: string
  href: string
  completed: boolean
}

interface OnboardingChecklistProps {
  workspaceSlug: string
  completedSteps: string[]
  hasBoard: boolean
  hasLead: boolean
  hasForm: boolean
  hasAutomation: boolean
}

export function OnboardingChecklist({
  workspaceSlug,
  completedSteps,
  hasBoard,
  hasLead,
  hasForm,
  hasAutomation,
}: OnboardingChecklistProps) {
  const [isPending, startTransition] = useTransition()

  const steps: Step[] = [
    {
      id: 'create_board',
      label: 'Create your first pipeline',
      description: 'Set up a kanban board to track leads through your sales stages.',
      href: `/w/${workspaceSlug}/boards`,
      completed: hasBoard || completedSteps.includes('create_board'),
    },
    {
      id: 'add_lead',
      label: 'Add your first lead',
      description: 'Create a lead manually or import via webhook from a form.',
      href: `/w/${workspaceSlug}/leads`,
      completed: hasLead || completedSteps.includes('add_lead'),
    },
    {
      id: 'connect_form',
      label: 'Connect a lead intake form',
      description: 'Wire Google Forms or your website to auto-create leads in your pipeline.',
      href: `/w/${workspaceSlug}/forms`,
      completed: hasForm || completedSteps.includes('connect_form'),
    },
    {
      id: 'create_automation',
      label: 'Set up an automation rule',
      description: 'Auto-assign tasks, move stages, or add notes when leads enter your pipeline.',
      href: `/w/${workspaceSlug}/automations`,
      completed: hasAutomation || completedSteps.includes('create_automation'),
    },
  ]

  const completedCount = steps.filter((s) => s.completed).length
  const allDone = completedCount === steps.length
  const progressPct = Math.round((completedCount / steps.length) * 100)

  function handleDismiss() {
    startTransition(() => dismissOnboarding(workspaceSlug))
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">
            {allDone ? '🎉 You\'re all set!' : 'Get started with LeadFlow'}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {allDone
              ? 'Your workspace is fully configured. Dismiss this whenever you\'re ready.'
              : `${completedCount} of ${steps.length} steps complete`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="mt-4 space-y-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            onClick={() => {
              if (!step.completed) {
                startTransition(() => completeOnboardingStep(workspaceSlug, step.id))
              }
            }}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
              step.completed
                ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                : 'border-border bg-background hover:bg-muted/50 hover:border-primary/30'
            )}
          >
            {step.completed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <div className={cn('font-medium', step.completed && 'line-through text-muted-foreground')}>
                {step.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{step.description}</div>
            </div>
            {!step.completed && (
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </Link>
        ))}
      </div>

      {allDone && (
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={handleDismiss} disabled={isPending} className="w-full">
            Dismiss checklist
          </Button>
        </div>
      )}
    </div>
  )
}

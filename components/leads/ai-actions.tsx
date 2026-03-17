'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Lightbulb, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { summarizeLead, suggestNextStep } from '@/app/actions/ai'
import { Button } from '@/components/ui/button'

interface AIActionsProps {
  workspaceSlug: string
  leadId: string
}

export function AIActions({ workspaceSlug, leadId }: AIActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const router = useRouter()

  const run = (action: 'summarize' | 'suggest') => {
    setActiveAction(action)
    startTransition(async () => {
      const fn = action === 'summarize' ? summarizeLead : suggestNextStep
      const res = await fn(workspaceSlug, leadId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(action === 'summarize' ? 'Summary added to notes.' : 'Next step task created.')
      }
      setActiveAction(null)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => run('summarize')}
        disabled={isPending}
      >
        {activeAction === 'summarize' ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <BrainCircuit className="mr-2 h-3.5 w-3.5 text-primary" />
        )}
        {activeAction === 'summarize' ? 'Summarizing…' : 'Summarize lead'}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => run('suggest')}
        disabled={isPending}
      >
        {activeAction === 'suggest' ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Lightbulb className="mr-2 h-3.5 w-3.5 text-primary" />
        )}
        {activeAction === 'suggest' ? 'Thinking…' : 'Suggest next step'}
      </Button>
    </>
  )
}

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toggleAutomationRule, deleteAutomationRule } from '@/app/actions/automations'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface AutomationActionsProps {
  workspaceSlug: string
  ruleId: string
  ruleName: string
  isActive: boolean
}

export function AutomationActions({ workspaceSlug, ruleId, ruleName, isActive }: AutomationActionsProps) {
  const router = useRouter()
  const [isToggling, startToggle] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  function handleToggle() {
    startToggle(async () => {
      await toggleAutomationRule(workspaceSlug, ruleId, !isActive)
      router.refresh()
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteAutomationRule(workspaceSlug, ruleId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${ruleName}" deleted.`)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={handleToggle}
        disabled={isToggling || isDeleting}
      >
        {isToggling ? <Loader2 className="h-3 w-3 animate-spin" /> : (isActive ? 'Pause' : 'Activate')}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isDeleting || isToggling}
          >
            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{ruleName}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This automation rule will be permanently removed and will stop firing immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

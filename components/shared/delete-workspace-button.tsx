'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteWorkspace } from '@/app/actions/workspaces'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Props {
  workspaceSlug: string
  workspaceName: string
  variant?: 'icon' | 'full'
}

export function DeleteWorkspaceButton({ workspaceSlug, workspaceName, variant = 'icon' }: Props) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const confirmed = typed.trim() === workspaceSlug

  function handleDelete() {
    if (!confirmed) return
    startTransition(async () => {
      const result = await deleteWorkspace(workspaceSlug)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${workspaceName}" has been deleted.`)
        setOpen(false)
        router.push('/workspaces')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTyped('') }}>
      <AlertDialogTrigger asChild>
        {variant === 'full' ? (
          <Button variant="destructive" className="w-full justify-between sm:w-auto">
            Delete workspace
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete workspace</span>
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{workspaceName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the workspace and <strong>everything inside it</strong> — all
            boards, stages, leads, notes, tasks, forms, and automations. There is no undo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-slug">
            Type <span className="font-mono font-semibold text-foreground">{workspaceSlug}</span> to confirm
          </Label>
          <Input
            id="confirm-slug"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={workspaceSlug}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!confirmed || isPending}
            onClick={handleDelete}
          >
            {isPending ? 'Deleting…' : 'Delete workspace'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

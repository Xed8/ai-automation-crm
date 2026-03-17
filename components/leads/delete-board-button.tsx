'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteBoard } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
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

interface Props {
  workspaceSlug: string
  boardId: string
  boardName: string
  redirectAfter?: boolean
}

export function DeleteBoardButton({ workspaceSlug, boardId, boardName, redirectAfter }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBoard(workspaceSlug, boardId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${boardName}" deleted.`)
        if (redirectAfter) {
          router.push(`/w/${workspaceSlug}/boards`)
        }
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete board</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{boardName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the board, all its stages, and every lead inside it.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete board
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

'use client'

import { useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createStage } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AddStageForm({ workspaceSlug, boardId }: { workspaceSlug: string; boardId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createStage(workspaceSlug, boardId, fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Stage created.')
        formRef.current?.reset()
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[1fr_auto]">
      <div className="space-y-2">
        <Label htmlFor="name">Stage name</Label>
        <Input id="name" name="name" placeholder="New inquiry" required disabled={isPending} />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full justify-between xl:w-auto" disabled={isPending}>
          {isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</>
            : <>Add stage <Plus className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  )
}

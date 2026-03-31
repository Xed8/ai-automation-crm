'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { seedSamplePipeline } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SamplePipelineButtonProps {
  workspaceSlug: string
}

export function SamplePipelineButton({ workspaceSlug }: SamplePipelineButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (isPending) return
    startTransition(async () => {
      const result = await seedSamplePipeline(workspaceSlug)
      if (result?.error) {
        toast.error(result.error)
      } else {
        router.push(`/w/${workspaceSlug}/boards/${result.boardId}`)
        router.refresh()
      }
    })
  }

  return (
    <Button onClick={handleSubmit} className="w-full justify-between" disabled={isPending}>
      {isPending ? (
        <>Loading...</>
      ) : (
        <>
          Load sample pipeline
          <Sparkles className="h-4 w-4" />
        </>
      )}
    </Button>
  )
}

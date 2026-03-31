'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical } from 'lucide-react'
import { createTestLead } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'

interface CreateTestLeadButtonProps {
  workspaceSlug: string
}

export function CreateTestLeadButton({ workspaceSlug }: CreateTestLeadButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (isPending) return
    startTransition(async () => {
      const result = await createTestLead(workspaceSlug)
      if (result?.error) {
        alert(result.error)
      } else {
        router.push(`/w/${workspaceSlug}/leads/${result.leadId}`)
        router.refresh()
      }
    })
  }

  return (
    <Button type="button" size="sm" className="gap-2" onClick={handleClick} disabled={isPending}>
      <FlaskConical className="h-3.5 w-3.5" />
      {isPending ? 'Creating...' : 'Create test lead'}
    </Button>
  )
}

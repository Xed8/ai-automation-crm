'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upgradeToProAction, downgradeToFreeAction } from '@/app/actions/billing'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function UpgradeButton({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await upgradeToProAction(workspaceSlug)
        router.refresh()
      })}
    >
      {isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Upgrading…</> : 'Upgrade to Pro'}
    </Button>
  )
}

export function DowngradeButton({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await downgradeToFreeAction(workspaceSlug)
        router.refresh()
      })}
    >
      {isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Downgrading…</> : 'Downgrade to Free'}
    </Button>
  )
}

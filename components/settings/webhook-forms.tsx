'use client'

import { useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createOutboundWebhook, deleteOutboundWebhook, sendInboundWebhookTest } from '@/app/actions/integrations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, ArrowUpRight } from 'lucide-react'
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

export function CreateWebhookForm({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createOutboundWebhook(workspaceSlug, fd)
      toast.success('Webhook saved.')
      formRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="eventType">Event type</Label>
        <select
          id="eventType"
          name="eventType"
          defaultValue="lead.created"
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        >
          <option value="lead.created">lead.created</option>
          <option value="lead.stage_changed">lead.stage_changed</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="endpointUrl">Destination URL</Label>
        <Input
          id="endpointUrl"
          name="endpointUrl"
          type="url"
          placeholder="https://example.com/api/webhooks/crm"
          required
          maxLength={500}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="secret">Signing secret</Label>
        <Input
          id="secret"
          name="secret"
          placeholder="Optional. Leave blank to generate one."
          maxLength={200}
          disabled={isPending}
        />
      </div>
      <Button type="submit" className="w-full justify-between" disabled={isPending}>
        {isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : <>Save webhook <Plus className="h-4 w-4" /></>}
      </Button>
    </form>
  )
}

export function DeleteWebhookButton({ workspaceSlug, webhookId }: { workspaceSlug: string; webhookId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('webhookId', webhookId)
      await deleteOutboundWebhook(workspaceSlug, fd)
      toast.success('Webhook removed.')
      router.refresh()
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between xl:w-auto" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Remove</span><Trash2 className="h-4 w-4" /></>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove webhook?</AlertDialogTitle>
          <AlertDialogDescription>
            This webhook endpoint will be permanently removed and will stop receiving events.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function SendTestLeadButton({ workspaceSlug, formId, baseUrl }: { workspaceSlug: string; formId: string; baseUrl: string }) {
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('formId', formId)
      fd.append('baseUrl', baseUrl)
      await sendInboundWebhookTest(workspaceSlug, fd)
      toast.success('Test lead sent.')
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="justify-between"
      disabled={isPending}
      onClick={handleSend}
    >
      {isPending
        ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Sending…</>
        : <>Send test lead <ArrowUpRight className="h-4 w-4" /></>}
    </Button>
  )
}

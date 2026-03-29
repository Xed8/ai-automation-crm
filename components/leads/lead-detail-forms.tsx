'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateLead, archiveLead, changeLeadStage, createNote } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
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
import { Database } from '@/types/supabase'

type Lead = Database['public']['Tables']['leads']['Row'] & {
  boards?: { name: string } | null
  stages?: { name: string } | null
  assigned_to?: { full_name?: string } | null
}
type Stage = { id: string; name: string; order: number }

// ─── Archive/Restore ────────────────────────────────────────────────────────

export function ArchiveLeadButton({
  workspaceSlug,
  leadId,
  leadName,
  isArchived,
}: {
  workspaceSlug: string
  leadId: string
  leadName: string
  isArchived: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (isArchived) {
    // Restore — no confirmation needed
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          const result = await archiveLead(workspaceSlug, leadId)
          if (result?.error) toast.error(result.error)
          else router.refresh()
        })}
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Restore lead'}
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-muted-foreground" disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Archive lead'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive &ldquo;{leadName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            The lead will be hidden from active views but can be restored at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => startTransition(async () => {
              const result = await archiveLead(workspaceSlug, leadId)
              if (result?.error) toast.error(result.error)
              else router.refresh()
            })}
          >
            Yes, archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Edit lead ───────────────────────────────────────────────────────────────

export function EditLeadForm({
  workspaceSlug,
  lead,
}: {
  workspaceSlug: string
  lead: Lead
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateLead(workspaceSlug, lead.id, fd)
      if (result?.error) toast.error(result.error)
      else { toast.success('Lead updated.'); router.refresh() }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="firm_name" className="text-xs">Firm name *</Label>
        <Input id="firm_name" name="firm_name" defaultValue={lead.firm_name} required className="h-8 text-sm" disabled={isPending} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact_name" className="text-xs">Contact name</Label>
        <Input id="contact_name" name="contact_name" defaultValue={lead.contact_name ?? ''} className="h-8 text-sm" disabled={isPending} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={lead.email ?? ''} className="h-8 text-sm" disabled={isPending} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-xs">Phone</Label>
        <Input id="phone" name="phone" defaultValue={lead.phone ?? ''} className="h-8 text-sm" disabled={isPending} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="value" className="text-xs">Deal value ($)</Label>
        <Input id="value" name="value" type="number" min="0" step="0.01" defaultValue={lead.value ?? ''} className="h-8 text-sm" disabled={isPending} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

// ─── Move stage ──────────────────────────────────────────────────────────────

export function MoveStageForm({
  workspaceSlug,
  leadId,
  currentStageId,
  stages,
}: {
  workspaceSlug: string
  leadId: string
  currentStageId: string | null
  stages: Stage[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await changeLeadStage(workspaceSlug, leadId, fd)
      if (result?.error) toast.error(result.error)
      else { toast.success('Stage updated.'); router.refresh() }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <select
        name="stage_id"
        defaultValue={currentStageId ?? ''}
        disabled={isPending}
        className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <Button type="submit" size="sm" className="h-9" disabled={isPending}>
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Move'}
      </Button>
    </form>
  )
}

// ─── Add note ────────────────────────────────────────────────────────────────

export function AddNoteForm({
  workspaceSlug,
  leadId,
}: {
  workspaceSlug: string
  leadId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!content.trim()) return
    const fd = new FormData()
    fd.append('content', content)
    setContent('')
    startTransition(async () => {
      const result = await createNote(workspaceSlug, leadId, fd)
      if (result?.error) toast.error(result.error)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        name="content"
        placeholder="Write a note…"
        rows={3}
        required
        className="resize-none text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
      />
      <Button type="submit" size="sm" className="w-full" disabled={isPending || !content.trim()}>
        {isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Adding…</> : 'Add note'}
      </Button>
    </form>
  )
}

// ─── Lead header (status badge + archive button together) ───────────────────

export function LeadHeader({
  workspaceSlug,
  lead,
}: {
  workspaceSlug: string
  lead: Lead
}) {
  const isArchived = lead.status === 'archived'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{lead.firm_name}</h1>
        <LeadStatusBadge status={lead.status ?? 'active'} />
      </div>
      <ArchiveLeadButton
        workspaceSlug={workspaceSlug}
        leadId={lead.id}
        leadName={lead.firm_name}
        isArchived={isArchived}
      />
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Zap } from 'lucide-react'
import { importAutomationTemplate } from '@/app/actions/automations'
import {
  AUTOMATION_TEMPLATES,
  TEMPLATE_CATEGORY_LABELS,
  type AutomationTemplate,
} from '@/lib/automations/templates'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type Stage = { id: string; name: string }
type Board = { id: string; name: string; stages: Stage[] }
type Member = { user_id: string; full_name: string }

interface TemplateLibraryProps {
  workspaceSlug: string
  boards: Board[]
  members: Member[]
}

const CATEGORY_ORDER: AutomationTemplate['category'][] = [
  'lead-intake',
  'follow-up',
  'pipeline',
  'team',
]

const CATEGORY_COLORS: Record<AutomationTemplate['category'], string> = {
  'lead-intake': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  'follow-up': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'pipeline': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  'team': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
}

export function TemplateLibrary({ workspaceSlug, boards, members }: TemplateLibraryProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Dialog state
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AutomationTemplate | null>(null)

  // Slot selections inside dialog
  const [boardId, setBoardId] = useState('')
  const [triggerStageId, setTriggerStageId] = useState('')
  const [actionStageId, setActionStageId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const selectedBoard = boards.find((b) => b.id === boardId)

  function openDialog(template: AutomationTemplate) {
    setSelected(template)
    setBoardId(boards[0]?.id ?? '')
    setTriggerStageId('')
    setActionStageId('')
    setAssigneeId('')
    setOpen(true)
  }

  function handleImport() {
    if (!selected || !boardId) return
    startTransition(async () => {
      const result = await importAutomationTemplate(
        workspaceSlug,
        selected.id,
        boardId,
        selected.needs_trigger_stage ? triggerStageId : undefined,
        selected.needs_action_stage ? actionStageId : undefined,
        selected.needs_assignee ? assigneeId : undefined,
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${selected.name}" added to your automations.`)
        setOpen(false)
        router.refresh()
      }
    })
  }

  const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  const templatesByCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    templates: AUTOMATION_TEMPLATES.filter((t) => t.category === cat),
  }))

  if (boards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a pipeline board first before using automation templates.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {templatesByCategory.map(({ category, templates }) => (
          <div key={category}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {TEMPLATE_CATEGORY_LABELS[category]}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] capitalize ${CATEGORY_COLORS[template.category]}`}
                    >
                      {TEMPLATE_CATEGORY_LABELS[template.category]}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                      {template.trigger_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-muted-foreground">→</span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                      {template.action_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full text-xs"
                    onClick={() => openDialog(template)}
                  >
                    <Zap className="mr-1.5 h-3 w-3" />
                    Use template
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Import dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Board picker — always required */}
            <div className="space-y-1.5">
              <Label className="text-xs">Pipeline (board) *</Label>
              <select
                value={boardId}
                onChange={(e) => { setBoardId(e.target.value); setTriggerStageId(''); setActionStageId('') }}
                className={selectClass}
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Trigger stage */}
            {selected?.needs_trigger_stage && (
              <div className="space-y-1.5">
                <Label className="text-xs">Trigger when lead enters stage *</Label>
                <select
                  value={triggerStageId}
                  onChange={(e) => setTriggerStageId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select a stage…</option>
                  {selectedBoard?.stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Action stage */}
            {selected?.needs_action_stage && (
              <div className="space-y-1.5">
                <Label className="text-xs">Move lead to stage *</Label>
                <select
                  value={actionStageId}
                  onChange={(e) => setActionStageId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select a stage…</option>
                  {selectedBoard?.stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Assignee */}
            {selected?.needs_assignee && (
              <div className="space-y-1.5">
                <Label className="text-xs">Assign to *</Label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select a member…</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isPending || !boardId}>
              {isPending
                ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Adding…</>
                : 'Add automation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

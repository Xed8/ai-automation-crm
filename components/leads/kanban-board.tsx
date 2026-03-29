'use client'

import { useCallback, useOptimistic, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { updateLeadStage, createLead, renameStage, deleteStage } from '@/app/actions/crm'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

type Lead = Database['public']['Tables']['leads']['Row']
type Stage = Database['public']['Tables']['stages']['Row']

interface KanbanBoardProps {
  stages: Stage[]
  leads: Lead[]
  workspaceSlug: string
  boardId: string
}

type LeadsByStage = Record<string, Lead[]>

function buildLeadsByStage(stages: Stage[], leads: Lead[]): LeadsByStage {
  return stages.reduce<LeadsByStage>((acc, stage) => {
    acc[stage.id] = leads.filter((l) => l.stage_id === stage.id)
    return acc
  }, {})
}

export function KanbanBoard({ stages, leads, workspaceSlug, boardId }: KanbanBoardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreating, startCreateTransition] = useTransition()
  const [isRenamingPending, startRenameTransition] = useTransition()
  const [isDeletingPending, startDeleteTransition] = useTransition()

  const [optimisticLeads, moveLeadOptimistic] = useOptimistic(
    leads,
    (current: Lead[], { leadId, newStageId }: { leadId: string; newStageId: string }) =>
      current.map((l) => (l.id === leadId ? { ...l, stage_id: newStageId } : l))
  )

  const leadsByStage = buildLeadsByStage(stages, optimisticLeads)

  // Drag state
  const draggingLeadId = useRef<string | null>(null)
  const draggingFromStageId = useRef<string | null>(null)
  const [overStageId, setOverStageId] = useState<string | null>(null)
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null)

  // Inline add lead form state
  const [openFormStageId, setOpenFormStageId] = useState<string | null>(null)
  const [newFirmName, setNewFirmName] = useState('')

  // Inline rename state
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleDragStart = useCallback((leadId: string, stageId: string) => {
    draggingLeadId.current = leadId
    draggingFromStageId.current = stageId
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setOverStageId(stageId)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent, stageId: string) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setOverStageId((prev) => (prev === stageId ? null : prev))
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetStageId: string) => {
      e.preventDefault()
      setOverStageId(null)

      const leadId = draggingLeadId.current
      const fromStageId = draggingFromStageId.current
      draggingLeadId.current = null
      draggingFromStageId.current = null

      if (!leadId || fromStageId === targetStageId || isPending) return

      setPendingLeadId(leadId)
      startTransition(async () => {
        moveLeadOptimistic({ leadId, newStageId: targetStageId })
        const result = await updateLeadStage(workspaceSlug, boardId, leadId, targetStageId)
        if (result?.error) {
          toast.error('Failed to move lead. Please try again.')
        }
        setPendingLeadId(null)
      })
    },
    [workspaceSlug, boardId, moveLeadOptimistic, isPending]
  )

  const handleDragEnd = useCallback(() => {
    draggingLeadId.current = null
    draggingFromStageId.current = null
    setOverStageId(null)
  }, [])

  const handleAddLead = useCallback(
    (stageId: string) => {
      const title = newFirmName.trim()
      if (!title) return
      setNewFirmName('')
      setOpenFormStageId(null)
      startCreateTransition(async () => {
        const fd = new FormData()
        fd.append('firmName', title)
        const result = await createLead(workspaceSlug, boardId, stageId, fd)
        if (result?.error) {
          toast.error(result.error)
        } else {
          router.refresh()
        }
      })
    },
    [newFirmName, workspaceSlug, boardId, router]
  )

  const startRename = (stage: Stage) => {
    setEditingStageId(stage.id)
    setEditingName(stage.name)
  }

  const commitRename = (stageId: string) => {
    const name = editingName.trim()
    if (!name) { setEditingStageId(null); return }
    setEditingStageId(null)
    startRenameTransition(async () => {
      const result = await renameStage(workspaceSlug, stageId, name)
      if (result?.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleDeleteStage = (stageId: string, stageName: string) => {
    startDeleteTransition(async () => {
      const result = await deleteStage(workspaceSlug, stageId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        if (result.movedCount && result.movedCount > 0) {
          toast.success(`"${stageName}" deleted. ${result.movedCount} lead${result.movedCount === 1 ? '' : 's'} moved to next stage.`)
        } else {
          toast.success(`"${stageName}" deleted.`)
        }
        router.refresh()
      }
    })
  }

  return (
    <div className="flex h-full min-h-[500px] items-start gap-4 pb-4">
      {stages.length === 0 && (
        <div className="surface-card flex h-full w-full items-center justify-center px-6 text-center text-muted-foreground">
          No stages yet. Add one above, then go to Forms to create the intake form.
        </div>
      )}

      {stages.map((stage) => {
        const stageLeads = leadsByStage[stage.id] ?? []
        const isOver = overStageId === stage.id
        const totalValue = stageLeads.reduce((sum, l) => sum + (l.value ?? 0), 0)
        const isFormOpen = openFormStageId === stage.id
        const isEditing = editingStageId === stage.id

        return (
          <div
            key={stage.id}
            className={[
              'surface-card flex h-full max-h-full w-80 flex-shrink-0 flex-col p-4 transition-colors',
              isOver ? 'ring-2 ring-primary/60 bg-primary/5' : '',
            ].join(' ')}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={(e) => handleDragLeave(e, stage.id)}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Column header */}
            <div className="mb-3 px-1">
              <div className="flex items-center justify-between gap-2">
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-1">
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(stage.id)
                        if (e.key === 'Escape') setEditingStageId(null)
                      }}
                      className="h-6 px-1.5 py-0 text-xs font-semibold uppercase tracking-[0.24em]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-emerald-500 hover:text-emerald-600"
                      onClick={() => commitRename(stage.id)}
                      disabled={isRenamingPending}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setEditingStageId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      className="group flex min-w-0 items-center gap-1.5 text-left"
                      onClick={() => startRename(stage)}
                      title="Click to rename"
                    >
                      <h3 className="truncate text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground group-hover:text-foreground transition-colors">
                        {stage.name}
                      </h3>
                      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-foreground">
                        {stageLeads.length}
                      </span>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground/40 hover:text-destructive transition-colors"
                            disabled={isDeletingPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete &ldquo;{stage.name}&rdquo;?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {stageLeads.length > 0
                                ? `This stage has ${stageLeads.length} lead${stageLeads.length === 1 ? '' : 's'}. They will be moved to the next available stage automatically.`
                                : 'This stage is empty and will be permanently removed.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStage(stage.id, stage.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete stage
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                ${totalValue.toLocaleString()} tracked
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-2">
              {stageLeads.map((lead) => {
                const isMoving = lead.id === pendingLeadId

                return (
                  <div
                    key={lead.id}
                    draggable={!isPending}
                    onDragStart={() => !isPending && handleDragStart(lead.id, stage.id)}
                    onDragEnd={handleDragEnd}
                    className={[
                      'rounded-lg transition-opacity',
                      isMoving ? 'opacity-50' : 'opacity-100',
                      isPending && !isMoving ? 'cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    <Link href={`/w/${workspaceSlug}/leads/${lead.id}`}>
                      <Card className="surface-card-hover cursor-grab active:cursor-grabbing rounded-lg border-border/70 shadow-sm select-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                          <CardTitle className="text-base font-semibold leading-none">
                            {lead.firm_name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-4 pt-0">
                          <div className="text-sm text-muted-foreground">
                            {lead.contact_name || 'No contact listed'}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <LeadStatusBadge status={lead.status ?? 'active'} />
                            <span className="font-semibold text-primary">
                              {lead.value ? `$${lead.value.toLocaleString()}` : 'No value'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                )
              })}

              {stageLeads.length === 0 && isOver && (
                <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 h-24 flex items-center justify-center text-xs text-muted-foreground">
                  Drop here
                </div>
              )}
            </div>

            {/* Inline add lead form */}
            {isFormOpen ? (
              <div className="mt-3 space-y-2">
                <Input
                  autoFocus
                  value={newFirmName}
                  onChange={(e) => setNewFirmName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddLead(stage.id)
                    if (e.key === 'Escape') { setOpenFormStageId(null); setNewFirmName('') }
                  }}
                  placeholder="Firm name…"
                  className="h-8 text-sm"
                  disabled={isCreating}
                />
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => handleAddLead(stage.id)}
                    disabled={isCreating || !newFirmName.trim()}
                  >
                    {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add lead'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => { setOpenFormStageId(null); setNewFirmName('') }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setOpenFormStageId(stage.id)}
                className="mt-3 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add lead
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

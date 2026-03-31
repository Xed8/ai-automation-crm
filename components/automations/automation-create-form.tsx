'use client'

import { useState, useTransition } from 'react'
import { createAutomationRule } from '@/app/actions/automations'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Zap } from 'lucide-react'

type Stage = { id: string; name: string; board_id: string }
type Board = { id: string; name: string }

const TRIGGER_LABELS: Record<string, string> = {
  lead_created: 'Lead is created',
  stage_changed: 'Lead moves to a stage',
  form_submitted: 'Form is submitted',
}

const ACTION_LABELS: Record<string, string> = {
  create_task: 'Create a task',
  create_note: 'Add a note',
  move_stage: 'Move to stage',
}

export function AutomationCreateForm({
  workspaceSlug,
  boards,
  stages,
}: {
  workspaceSlug: string
  boards: Board[]
  stages: Stage[]
}) {
  const [trigger, setTrigger] = useState('lead_created')
  const [action, setAction] = useState('create_task')
  const [boardId, setBoardId] = useState(boards[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const boardStages = stages.filter((s) => s.board_id === boardId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createAutomationRule(workspaceSlug, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        ;(e.target as HTMLFormElement).reset()
        setTrigger('lead_created')
        setAction('create_task')
        toast.success('Automation created.')
      }
    })
  }

  return (
    <Card className="surface-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle>New automation</CardTitle>
        </div>
        <CardDescription>
          Define a trigger and an action. The engine runs automatically whenever the trigger fires.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Rule name */}
          <div className="space-y-1.5">
            <Label htmlFor="auto-name">Rule name</Label>
            <Input id="auto-name" name="name" placeholder="e.g. Create follow-up task on new lead" required maxLength={100} className="h-9 text-sm" />
          </div>

          {/* Board */}
          <div className="space-y-1.5">
            <Label>Pipeline (board)</Label>
            <select
              name="board_id"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Trigger */}
          <div className="space-y-1.5">
            <Label>Trigger — when this happens…</Label>
            <select
              name="trigger_type"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Trigger config: stage_changed → pick stage */}
          {trigger === 'stage_changed' && (
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-3">
              <Label className="text-xs">When lead moves to which stage?</Label>
              <select
                name="trigger_stage_id"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Any stage</option>
                {boardStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Action */}
          <div className="space-y-1.5">
            <Label>Action — do this…</Label>
            <select
              name="action_type"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Action config */}
          {action === 'create_task' && (
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-3">
              <Label htmlFor="auto-task-title" className="text-xs">Task title</Label>
              <Input
                id="auto-task-title"
                name="action_task_title"
                placeholder="e.g. Send intro email"
                maxLength={200}
                className="h-8 text-sm"
                required
              />
            </div>
          )}

          {action === 'create_note' && (
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-3">
              <Label htmlFor="auto-note" className="text-xs">Note content</Label>
              <Input
                id="auto-note"
                name="action_note_content"
                placeholder="e.g. Lead entered proposal stage — review required"
                maxLength={2000}
                className="h-8 text-sm"
                required
              />
            </div>
          )}

          {action === 'move_stage' && (
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-3">
              <Label className="text-xs">Move to which stage?</Label>
              <select
                name="action_stage_id"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {boardStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isPending ? 'Saving…' : 'Create automation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

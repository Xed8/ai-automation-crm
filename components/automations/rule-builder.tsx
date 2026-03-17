'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createAutomationRule } from '@/app/actions/automations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Stage = { id: string; name: string }
type Board = { id: string; name: string; stages: Stage[] }
type Member = { user_id: string; full_name: string }

interface RuleBuilderProps {
  boards: Board[]
  members: Member[]
  workspaceSlug: string
}

const TRIGGERS: { value: string; label: string }[] = [
  { value: 'lead_created', label: 'Lead is created' },
  { value: 'stage_changed', label: 'Lead moves to a specific stage' },
  { value: 'form_submitted', label: 'Form is submitted' },
]

const ACTIONS: { value: string; label: string }[] = [
  { value: 'create_task', label: 'Create a task' },
  { value: 'move_stage', label: 'Move lead to a stage' },
  { value: 'create_note', label: 'Add a note to the lead' },
  { value: 'assign_owner', label: 'Assign lead to a team member' },
]

export function RuleBuilder({ boards, members, workspaceSlug }: RuleBuilderProps) {
  const [isPending, startTransition] = useTransition()
  const [boardId, setBoardId] = useState('')
  const [triggerType, setTriggerType] = useState('')
  const [actionType, setActionType] = useState('')

  const selectedBoard = boards.find((b) => b.id === boardId)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const res = await createAutomationRule(workspaceSlug, fd)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Automation rule created.')
        form.reset()
        setBoardId('')
        setTriggerType('')
        setActionType('')
      }
    })
  }

  const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      {/* Rule name */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="rule-name" className="text-xs">Rule name *</Label>
        <Input
          id="rule-name"
          name="name"
          placeholder="e.g. Auto-task when lead enters Qualification"
          required
          className="h-9 text-sm"
        />
      </div>

      {/* Board picker */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs">Pipeline (board) *</Label>
        <select
          name="board_id"
          value={boardId}
          onChange={(e) => { setBoardId(e.target.value); setTriggerType(''); setActionType('') }}
          required
          className={selectClass}
        >
          <option value="">Select a board…</option>
          {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {boardId && (
        <>
          {/* Trigger */}
          <div className="space-y-1.5">
            <Label className="text-xs">When this happens *</Label>
            <select
              name="trigger_type"
              value={triggerType}
              onChange={(e) => { setTriggerType(e.target.value); setActionType('') }}
              required
              className={selectClass}
            >
              <option value="">Select a trigger…</option>
              {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Trigger config: stage picker */}
          {triggerType === 'stage_changed' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Which stage? *</Label>
              <select name="trigger_stage_id" required className={selectClass}>
                <option value="">Select a stage…</option>
                {selectedBoard?.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Spacer if trigger has no extra config */}
          {triggerType && triggerType !== 'stage_changed' && <div />}

          {/* Action */}
          {triggerType && (
            <div className="space-y-1.5">
              <Label className="text-xs">Then do this *</Label>
              <select
                name="action_type"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">Select an action…</option>
                {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          )}

          {/* Action config */}
          {actionType === 'create_task' && (
            <div className="space-y-1.5">
              <Label htmlFor="action-task-title" className="text-xs">Task title *</Label>
              <Input
                id="action-task-title"
                name="action_task_title"
                placeholder="e.g. Follow up with client"
                required
                className="h-9 text-sm"
              />
            </div>
          )}

          {actionType === 'move_stage' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Move to stage *</Label>
              <select name="action_stage_id" required className={selectClass}>
                <option value="">Select a stage…</option>
                {selectedBoard?.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {actionType === 'create_note' && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="action-note" className="text-xs">Note content *</Label>
              <Textarea
                id="action-note"
                name="action_note_content"
                placeholder="e.g. Lead automatically moved to this stage."
                required
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          )}

          {actionType === 'assign_owner' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Assign to *</Label>
              <select name="action_assignee_id" required className={selectClass}>
                <option value="">Select a member…</option>
                {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}
              </select>
            </div>
          )}

          {triggerType && actionType && (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isPending} size="sm">
                {isPending ? 'Creating…' : 'Create rule'}
              </Button>
            </div>
          )}
        </>
      )}
    </form>
  )
}

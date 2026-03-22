'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Loader2, Calendar, UserCircle2, ChevronDown } from 'lucide-react'
import { createTask, toggleTask } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

type TaskRow = Database['public']['Tables']['tasks']['Row']

interface Assignee {
  id: string
  full_name: string | null
  avatar_url: string | null
}

type Task = TaskRow & { assignee?: Assignee | null }

interface Member {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface TaskListProps {
  tasks: Task[]
  workspaceSlug: string
  leadId: string
  members: Member[]
}

function MemberAvatar({ member, size = 5 }: { member: Pick<Member, 'full_name' | 'avatar_url'>; size?: number }) {
  if (member.avatar_url) {
    return (
      <Image
        src={member.avatar_url}
        alt={member.full_name ?? ''}
        width={size * 4}
        height={size * 4}
        className={cn(`h-${size} w-${size} rounded-full object-cover shrink-0`)}
        unoptimized
      />
    )
  }
  return <UserCircle2 className={`h-${size} w-${size} text-muted-foreground shrink-0`} />
}

function MemberPicker({
  members,
  value,
  onChange,
  disabled,
}: {
  members: Member[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = members.find(m => m.id === value)

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
      >
        {selected ? (
          <>
            <MemberAvatar member={selected} size={4} />
            <span className="max-w-[100px] truncate text-xs">{selected.full_name ?? 'Unknown'}</span>
          </>
        ) : (
          <>
            <UserCircle2 className="h-4 w-4" />
            <span className="text-xs">Assign</span>
          </>
        )}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-md border border-border bg-popover shadow-lg">
          <div
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            onClick={() => { onChange(''); setOpen(false) }}
          >
            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Unassigned</span>
          </div>
          {members.map(m => (
            <div
              key={m.id}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              onClick={() => { onChange(m.id); setOpen(false) }}
            >
              <MemberAvatar member={m} size={4} />
              <span className="truncate">{m.full_name ?? 'Unknown'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TaskList({ tasks, workspaceSlug, leadId, members }: TaskListProps) {
  const [isAddPending, startAddTransition] = useTransition()
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [showDateInput, setShowDateInput] = useState(false)

  const [optimisticTasks, applyOptimistic] = useOptimistic(
    tasks,
    (current: Task[], update: { type: 'toggle'; taskId: string; completed: boolean }) => {
      if (update.type === 'toggle') {
        return current.map((t) =>
          t.id === update.taskId ? { ...t, is_completed: update.completed } : t
        )
      }
      return current
    }
  )

  const handleToggle = (task: Task) => {
    if (togglingIds.has(task.id)) return
    setTogglingIds(prev => new Set(prev).add(task.id))
    applyOptimistic({ type: 'toggle', taskId: task.id, completed: !task.is_completed })
    toggleTask(workspaceSlug, task.id, !task.is_completed).finally(() => {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(task.id); return s })
    })
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title || isAddPending) return
    setNewTitle('')
    setNewDueDate('')
    setNewAssignee('')
    setShowDateInput(false)
    startAddTransition(async () => {
      const fd = new FormData()
      fd.append('title', title)
      if (newDueDate) fd.append('due_date', newDueDate)
      if (newAssignee) fd.append('assigned_to', newAssignee)
      await createTask(workspaceSlug, leadId, fd)
    })
  }

  const pending = optimisticTasks.filter((t) => !t.is_completed)
  const done = optimisticTasks.filter((t) => t.is_completed)

  return (
    <div className="space-y-2">
      {optimisticTasks.length === 0 && (
        <p className="text-xs text-muted-foreground">No tasks yet. Add one below or use AI to suggest.</p>
      )}

      {/* Pending tasks */}
      {pending.map((task) => (
        <div key={task.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={false}
            onChange={() => handleToggle(task)}
            disabled={togglingIds.has(task.id)}
            className="mt-0.5 accent-primary cursor-pointer disabled:opacity-50"
          />
          <div className="flex-1 min-w-0">
            <span>{task.title}</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {task.due_date && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString()}
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MemberAvatar member={task.assignee} size={3} />
                  <span>{task.assignee.full_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Completed tasks */}
      {done.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground transition-colors">
            {done.length} completed
          </summary>
          <div className="mt-2 space-y-1.5">
            {done.map((task) => (
              <div key={task.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-sm opacity-60">
                <input
                  type="checkbox"
                  checked
                  onChange={() => handleToggle(task)}
                  disabled={togglingIds.has(task.id)}
                  className="mt-0.5 accent-primary cursor-pointer disabled:opacity-50"
                />
                <div className="flex-1 min-w-0">
                  <span className="line-through text-muted-foreground">{task.title}</span>
                  {task.assignee && (
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MemberAvatar member={task.assignee} size={3} />
                      <span>{task.assignee.full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Add task form */}
      <form onSubmit={handleAdd} className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setNewTitle(''); setShowDateInput(false) } }}
            placeholder="Add a task…"
            className="h-8 text-sm"
            disabled={isAddPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 text-muted-foreground"
            title="Set due date"
            onClick={() => setShowDateInput((v) => !v)}
          >
            <Calendar className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="submit"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            disabled={isAddPending || !newTitle.trim()}
          >
            {isAddPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {showDateInput && (
          <Input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="h-8 text-sm"
          />
        )}
        {members.length > 0 && (
          <MemberPicker
            members={members}
            value={newAssignee}
            onChange={setNewAssignee}
            disabled={isAddPending}
          />
        )}
      </form>
    </div>
  )
}

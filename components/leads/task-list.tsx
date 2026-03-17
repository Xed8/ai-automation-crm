'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { Plus, Loader2, Calendar } from 'lucide-react'
import { createTask, toggleTask } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

interface TaskListProps {
  tasks: Task[]
  workspaceSlug: string
  leadId: string
}

export function TaskList({ tasks, workspaceSlug, leadId }: TaskListProps) {
  const [isPending, startTransition] = useTransition()
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
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
    startTransition(async () => {
      applyOptimistic({ type: 'toggle', taskId: task.id, completed: !task.is_completed })
      await toggleTask(workspaceSlug, task.id, !task.is_completed)
    })
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title || isPending) return
    setNewTitle('')
    setNewDueDate('')
    setShowDateInput(false)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('title', title)
      if (newDueDate) fd.append('due_date', newDueDate)
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
            disabled={isPending}
            className="mt-0.5 accent-primary cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <span>{task.title}</span>
            {task.due_date && (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
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
                  disabled={isPending}
                  className="mt-0.5 accent-primary cursor-pointer"
                />
                <span className="line-through text-muted-foreground">{task.title}</span>
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
            disabled={isPending}
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
            disabled={isPending || !newTitle.trim()}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
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
      </form>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createLeadForm } from '@/app/actions/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Board {
  id: string
  name: string
}

interface Stage {
  id: string
  name: string
  board_id: string
}

interface CreateFormProps {
  workspaceSlug: string
  defaultBoardId: string | null
  defaultStageId: string | null
  boards: Board[]
  stages: Stage[]
}

export function CreateForm({ workspaceSlug, defaultBoardId, defaultStageId, boards, stages }: CreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [boardId, setBoardId] = useState(defaultBoardId || '')
  const [stageId, setStageId] = useState(defaultStageId || '')
  const [error, setError] = useState('')

  const MAX_NAME_LENGTH = 100

  function validateName(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) return 'Form name is required'
    if (trimmed.length > MAX_NAME_LENGTH) return `Form name must be ${MAX_NAME_LENGTH} characters or less`
    if (!/^[a-zA-Z0-9\s\-_&'()]+$/.test(trimmed)) return 'Form name can only contain letters, numbers, spaces, and basic punctuation'
    return ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nameError = validateName(name)
    if (nameError) {
      setError(nameError)
      return
    }
    if (!boardId || !stageId || isPending) return
    setError('')

    startTransition(async () => {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('boardId', boardId)
      fd.append('stageId', stageId)
      const result = await createLeadForm(workspaceSlug, fd)
      if (result?.error) {
        alert(result.error)
      } else {
        router.push(`/w/${workspaceSlug}/forms?status=success&message=${encodeURIComponent('Form created. You can now connect Google Forms or external websites.')}`)
        router.refresh()
      }
    })
  }

  const filteredStages = stages.filter(s => s.board_id === boardId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Form name <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          placeholder="Google Form Intake"
          required
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          disabled={isPending}
          className={error ? 'border-destructive' : ''}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={name.length > MAX_NAME_LENGTH * 0.9 ? 'text-destructive' : ''}>
            {name.length}/{MAX_NAME_LENGTH}
          </span>
          {error && <span className="text-destructive">{error}</span>}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="boardId">Board <span className="text-destructive">*</span></Label>
          <select
            id="boardId"
            name="boardId"
            value={boardId}
            onChange={(e) => { setBoardId(e.target.value); setStageId('') }}
            disabled={isPending}
            required
            className="flex h-11 w-full rounded-2xl border border-input/80 bg-background/85 px-4 py-3 text-sm shadow-sm ring-offset-background backdrop-blur-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a board...</option>
            {boards.map((board) => (
              <option key={board.id} value={board.id}>{board.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stageId">Stage <span className="text-destructive">*</span></Label>
          <select
            id="stageId"
            name="stageId"
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            disabled={isPending || !boardId}
            required
            className="flex h-11 w-full rounded-2xl border border-input/80 bg-background/85 px-4 py-3 text-sm shadow-sm ring-offset-background backdrop-blur-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a stage...</option>
            {filteredStages.map((stage) => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full justify-between xl:w-auto" disabled={isPending || !name.trim() || !boardId || !stageId}>
            {isPending ? (
              <>Creating...</>
            ) : (
              <>
                Create form
                <Plus className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

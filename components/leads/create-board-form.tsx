'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createBoard } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CreateBoardFormProps {
  workspaceSlug: string
}

export function CreateBoardForm({ workspaceSlug }: CreateBoardFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const MAX_NAME_LENGTH = 100
  const MAX_DESC_LENGTH = 500

  function validateName(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) return 'Board name is required'
    if (trimmed.length > MAX_NAME_LENGTH) return `Board name must be ${MAX_NAME_LENGTH} characters or less`
    if (!/^[a-zA-Z0-9\s\-_&'()]+$/.test(trimmed)) return 'Board name can only contain letters, numbers, spaces, and basic punctuation'
    return ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nameError = validateName(name)
    if (nameError) {
      setError(nameError)
      return
    }
    if (isPending) return
    setError('')

    startTransition(async () => {
      const fd = new FormData()
      fd.append('name', name.trim())
      if (description.trim()) {
        fd.append('description', description.trim().slice(0, MAX_DESC_LENGTH))
      }
      const result = await createBoard(workspaceSlug, fd)
      if (result?.error) {
        alert(result.error)
      } else {
        router.push(`/w/${workspaceSlug}/boards/${result.boardId}`)
        router.refresh()
      }
    })
  }

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle>Create board</CardTitle>
        <CardDescription>
          Start here. After creating a board, open it and add at least one stage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[1fr_1.3fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="name">Board name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="Inbound Sales Pipeline"
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Track website and outbound opportunities."
              maxLength={MAX_DESC_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
            <div className="text-xs text-muted-foreground">
              {description.length}/{MAX_DESC_LENGTH}
            </div>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full justify-between xl:w-auto" disabled={isPending || !name.trim()}>
              {isPending ? (
                <>Creating...</>
              ) : (
                <>
                  Create board
                  <Plus className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
